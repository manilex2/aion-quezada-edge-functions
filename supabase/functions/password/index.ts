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
import {
  genSaltSync,
} from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

import nodemailer from "npm:nodemailer@6.9.14";

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


app.put('/password/changePassword', async (req: express.Request, res: express.Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    let supabase;

    let accessToken: string;

    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
      // Obtener el token del encabezado de autorización
      const authHeader = req.headers.authorization || "";
      accessToken = authHeader.split(' ')[1]; // Asumiendo que el token viene como "Bearer <token>"

      if (!accessToken) {
        throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
      }

      // Establecer el token de autenticación en el cliente de Supabase
      supabase.auth.setSession({access_token: accessToken, refresh_token: ''});

      // Verificar si el token es válido obteniendo los datos del usuario
      const { data: user, error } = await supabase.auth.getUser();

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
    res.status(200).send({ message: "Contraseña cambiada correctamente." });
  } catch (error) {
    if (typeof error === "string") {
      if (error.startsWith("BAD REQUEST")) {
        res.status(400).send({ message: `Ocurrió el siguiente error de solicitud incorrecta: ${error}` });
      } else if (error.startsWith("UNAUTHORIZED")) {
        res.status(401).send({ message: `Ocurrió el siguiente error de autorización: ${error}` });
      } else if (error.startsWith("FORBIDDEN")) {
        res.status(403).send({ message: `Ocurrió el siguiente error de prohibición: ${error}` });
      } else if (error.startsWith("NOT FOUND")) {
        res.status(404).send({ message: `Ocurrió el siguiente error de localización: ${error}` });
      } else if (error.startsWith("CONFLICT")) {
        res.status(409).send({ message: `Ocurrió el siguiente error de conflictos: ${error}` });
      } else {
        res.status(500).send({ message: `Ocurrió el siguiente error: ${error}` });
      }
    } else {
      res.status(500).send({ message: `Ocurrió el siguiente error: ${error}` });
    }
  }
})

app.post('/password/forgotPassword', async (req: express.Request, res: express.Response) => {    
  try {
    res.setHeader('Content-Type', 'application/json');

    let supabase;

    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    } else {
      console.log("ENTORNO: DESARROLLO");
      supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }

    const body = req.body;
    const saltRounds = 10;
    let clave = genSaltSync(saltRounds);
    
    if (clave.endsWith('.')) {
      clave = clave.slice(0, -1);
    }

    const { data: userRegister, error: userRegisterError } = await supabase.from("users").select().eq("email", body.email).limit(1).single();
    if (!userRegister) {
      console.error(userRegisterError);
      throw "NOT FOUND: El usuario no se encuentra registrado";
    }

    const { data: user, error: userError } = await supabase.auth.admin.updateUserById(
      userRegister.id,
      { password: clave }
    );
    if (userError) {
      console.error(userError);
      throw `UNAUTHORIZED: ${userError}`;
    } else {
      console.log("Contraseña cambiada con exito: ", user);
    }

    const { error: userChangedError } = await supabase
      .from("users")
      .update({ first_login: true })
      .eq('id', userRegister.id)

    if (userChangedError) {
      console.error(userChangedError);
      throw userChangedError;
    }

    const transporter = nodemailer.createTransport({

      host: Deno.env.get("SENDGRID_HOST"),
      port: Deno.env.get("SENDGRID_PORT"),
      auth: {
        user: Deno.env.get("SENDGRID_USER"),
        pass: Deno.env.get("SENDGRID_API_KEY"),
      },
    });

    try {
      transporter.sendMail({
        from: `${Deno.env.get("SENDGRID_SENDER_NAME")} ${Deno.env.get("SENDGRID_SENDER_EMAIL")}`,
        to: `${body.email}`,
        subject: `Reestablecimiento de contraseña en ${Deno.env.get("AION_NAME")}`,
        html: `<p>Hola ${userRegister.display_name}</p><p>Su contraseña ha sido reestablecida correctamente en ${Deno.env.get("AION_NAME")}.</p><p>Su contraseña provisional: <b>${clave}</b></p><p>Al iniciar sesión se le solicitará cambiar la contraseña.</p><p>Para ingresar a la plataforma de ${Deno.env.get("AION_NAME")} puede ingresar a través del siguiente link: <a href="${Deno.env.get("AION_URL")}">${Deno.env.get("AION_NAME")}</a></p><p>Atentamente</p><p><b>El equipo de ${Deno.env.get("AION_NAME")}</b></p>`,
      // deno-lint-ignore no-explicit-any
      }, (err: any, info: nodemailer.SentMessageInfo) => {
        if (err) {
          console.log(err);
        } else {
          console.log(info);
        }
      }),
      // deno-lint-ignore no-explicit-any
      (error: any) => {
        if (error) {
          console.log(error);
          throw new Error(error);
        }
      };
    } catch (error) {
      throw new Error(error);
    }

    console.log("OK");
    res.status(201).send({ message: "Contraseña reestablecida correctamente." });
  } catch (error) {
    if (typeof error === "string") {
      if (error.startsWith("BAD REQUEST")) {
        res.status(400).send({ message: `Ocurrió el siguiente error de solicitud incorrecta: ${error}` });
      } else if (error.startsWith("UNAUTHORIZED")) {
        res.status(401).send({ message: `Ocurrió el siguiente error de autorización: ${error}` });
      } else if (error.startsWith("FORBIDDEN")) {
        res.status(403).send({ message: `Ocurrió el siguiente error de prohibición: ${error}` });
      } else if (error.startsWith("NOT FOUND")) {
        res.status(404).send({ message: `Ocurrió el siguiente error de localización: ${error}` });
      } else if (error.startsWith("CONFLICT")) {
        res.status(409).send({ message: `Ocurrió el siguiente error de conflictos: ${error}` });
      } else {
        res.status(500).send({ message: `Ocurrió el siguiente error: ${error}` });
      }
    } else {
      res.status(500).send({ message: `Ocurrió el siguiente error: ${error}` });
    }
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});