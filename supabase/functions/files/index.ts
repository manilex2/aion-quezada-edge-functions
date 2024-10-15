// @deno-types="npm:@types/morgan";
import morgan from "npm:morgan@1.10.0";

// @deno-types="npm:@types/express";
import express from "npm:express@4.18.3";

import { config } from "npm:dotenv@16.4.5";
import process from "node:process";
import { SupabaseClient, createClient } from "https://esm.sh/@supabase/supabase-js@2.44.1"
import { Database } from "../database.types.ts";
// import { getCorsHeaders } from '../_shared/cors.ts';
// @deno-types="npm:@types/cors";
import cors, { CorsOptions } from "npm:cors";

const PORT = process.env.PORT || 3000;

config();

const app = express();
app.use(morgan("dev"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const whitelist = ['https://aion-juridico.flutterflow.app', 'https://app.flutterflow.io/debug', 'https://app.estudioquezada.com.ec', 'https://aion-juridico-app-flutter.web.app'];
const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin!) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  }
}

app.options('*', cors(corsOptions));

app.post('/files/deleteFile', cors(corsOptions), async (req: express.Request, res: express.Response) => { 
  try {
    let supabase: SupabaseClient<Database>;

    let accessToken: string;

    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: {
          headers: { Authorization: req.headers.authorization! }
        }
      });
      // Primero tomar el token del header de autorizacion
      accessToken = req.headers.authorization!.replace('Bearer ', '')

      // Verificar si el token es válido obteniendo los datos del usuario
      const { data: user, error } = await supabase.auth.getUser(accessToken);

      if (!accessToken) {
        throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
      }

      if (error || !user) {
        throw 'UNAUTHORIZED: Token de autorización inválido.';
      }

    } else {
      console.log("ENTORNO: DESARROLLO");
      supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }

    // Obtener bucketName y pathName desde el body de la solicitud
    const { bucket_name, path_name } = req.body;

    if (!bucket_name || !path_name) {
      throw "BAD REQUEST: No se proporcionaron bucket_name o path_name";
    }

    // Eliminar el archivo de Supabase Storage
    const { data: _deleteData, error: deleteError } = await supabase
      .storage
      .from(bucket_name)
      .remove([path_name]);

    if (deleteError) {
      throw deleteError;
    }

    // Responder con éxito
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    const errorJSON = JSON.stringify(error);
    if (typeof error === "string") {
      if (error.startsWith("BAD REQUEST")) {
        res.status(400).send({ message: `Ocurrió el siguiente error de solicitud incorrecta: ${errorJSON}` });
      } else if (error.startsWith("UNAUTHORIZED")) {
        res.status(401).send({ message: `Ocurrió el siguiente error de autorización: ${errorJSON}` });
      } else if (error.startsWith("FORBIDDEN")) {
        res.status(403).send({ message: `Ocurrió el siguiente error de prohibición: ${errorJSON}` });
      } else if (error.startsWith("NOT FOUND")) {
        res.status(404).send({ message: `Ocurrió el siguiente error de localización: ${errorJSON}` });
      } else if (error.startsWith("CONFLICT")) {
        res.status(409).send({ message: `Ocurrió el siguiente error de conflictos: ${errorJSON}` });
      } else {
        res.status(500).send({ message: `Ocurrió el siguiente error: ${errorJSON}` });
      }
    } else {
      res.status(500).send({ message: `Ocurrió el siguiente error: ${errorJSON}` });
    }
  }
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
