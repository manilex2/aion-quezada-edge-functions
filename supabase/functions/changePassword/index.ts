// @deno-types="npm:@types/morgan";
import morgan from "npm:morgan@1.10.0";

// @deno-types="npm:@types/express";
import express from "npm:express@4.18.3";

import { config } from "npm:dotenv@16.4.5";
import process from "node:process";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.1"
import { Database } from "../database.types.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import cors from "npm:cors";

const PORT = process.env.PORT || 3000;

config();

const app = express();
app.use(morgan("dev"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// Middleware CORS personalizado
app.use((req, res, next) => {
  const origin = req.headers.origin as string;
  const corsHeaders = getCorsHeaders(origin);

  for (const header in corsHeaders) {
      res.setHeader(header, corsHeaders[header]);
  }

  // Responder a las solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
      return res.status(204).end();
  }

  next();
});


app.put('/changePassword', async (req: express.Request, res: express.Response) => {
  try {
    let supabase;
    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
      }
      supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
    } else {
      console.log("ENTORNO: DESARROLLO");
      supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }

    if (!req.body.password) {
      throw "BAD REQUEST: No se proporcionó una contraseña";
    } else if(!req.body.email) {
      throw "BAD REQUEST: No se proporcionó un email";
    }

    const body = req.body;

    const { error: errorLogged } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.old_password,
    });
    if (errorLogged) {
      throw "UNAUTHORIZED: La contraseña anterior o email no es correcto";
    }

    const { error: userRegisterError } = await supabase.from("users").select().eq('email', body.email).limit(1).single();
    if (userRegisterError) {
      console.error(userRegisterError);
      throw "NOT FOUND: El usuario no se encuentra registrado";
    }

    const { error: userError } = await supabase.auth.updateUser({
      password: body.password,
    });
    if (userError) {
      console.error(userError);
      throw userError;
    }
    console.log("OK");
    res.status(200).json({ message: "Contraseña cambiada correctamente." });
  } catch (error) {
    if (typeof error === "string") {
      if (error.startsWith("BAD REQUEST")) {
        res.status(400).json({ message: `Ocurrió el siguiente error de solicitud incorrecta: ${error}` });
      } else if (error.startsWith("UNAUTHORIZED")) {
        res.status(401).json({ message: `Ocurrió el siguiente error de autorización: ${error}` });
      } else if (error.startsWith("FORBIDDEN")) {
        res.status(403).json({ message: `Ocurrió el siguiente error de prohibición: ${error}` });
      } else if (error.startsWith("NOT FOUND")) {
        res.status(404).json({ message: `Ocurrió el siguiente error de localización: ${error}` });
      } else if (error.startsWith("CONFLICT")) {
        res.status(409).json({ message: `Ocurrió el siguiente error de conflictos: ${error}` });
      } else {
        res.status(500).json({ message: `Ocurrió el siguiente error: ${error}` });
      }
    } else {
      res.status(500).json({ message: `Ocurrió el siguiente error: ${error}` });
    }
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});