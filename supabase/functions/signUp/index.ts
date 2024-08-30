// @deno-types="npm:@types/morgan";
import morgan from "npm:morgan@1.10.0";

// @deno-types="npm:@types/express";
import express from "npm:express@4.18.3";

import {
  genSaltSync,
} from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

import nodemailer from "npm:nodemailer@6.9.14";

import { config } from "npm:dotenv@16.4.5";
import process from "node:process";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.1"
import { Database } from "../database.types.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import cors from "npm:cors";

const PORT = process.env.PORT || 3000;

interface Department {
  code: string | null;
  color: string | null;
  created_at: string;
  department_name: string | null;
  director_id: string | null;
  icon: string | null;
  icon_dark: string | null;
  id: string;
  institution_id: string | null;
  seleccion_temp: boolean | null;
}

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


app.post('/signUp', async (req: express.Request, res: express.Response) => {  
  try {
    let supabase;

    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
      }
      supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
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
        }}
      )
    }
    const body = req.body;
    const saltRounds = 10;
    let clave = genSaltSync(saltRounds);
    
    if (clave.endsWith('.')) {
      clave = clave.slice(0, -1);
    }

    const { data: userRegister, error: userRegisterError } = await supabase.from("users").select().eq("email", body.email).limit(1).single();
    if (userRegister) {
      console.error(userRegisterError);
      throw "CONFLICT: El usuario ya se encuentra registrado";
    }

    const { data: user, error: userError } = await supabase.auth.signUp({
      email: body.email,
      password: clave,
    });
    if (userError) {
      console.error(userError);
      throw `UNAUTHORIZED: ${userError}`;
    } else {
      console.log("Usuario creado con éxito: ", user.user?.id)
    }

    const { data: institution, error: institutionError } = await supabase.from("institution").select().eq("id", body.institucion_id).limit(1).single();
    if (institutionError) {
      console.error(institutionError);
      throw institutionError;
    };

    let departmentData: Department = {
      code: null,
      color: null,
      created_at: "",
      department_name: null,
      director_id: null,
      icon: null,
      icon_dark: null,
      id: "",
      institution_id: null,
      seleccion_temp: null
    };

    if (body.departamento_id) {
      const { data: department, error: departmentError } = await supabase.from("departments").select().eq("id", body.departamento_id).limit(1).single();
      if (departmentError) {
        console.error(departmentError);
        throw departmentError;
      };
      departmentData = department;
    }

    const { data: registerUser, error: registerUserError } = await supabase.from("users").select().eq("id", body.registrado_por_id).limit(1).single();
    if (registerUserError) {
      console.error(registerUserError);
      throw registerUserError;
    };

    const { error: userDBError } = await supabase.from("users").insert({
      id: `${user.user?.id}`,
      email: `${user.user?.email}`,
      first_login: true,
      institution_id: institution.id,
      names: body.nombres?? "N/D",
      surnames: body.apellidos ?? "N/D",
      enable: body.habilitado ?? true,
      rol_name: body.rol?? "N/D",
      department_id: body.departamento_id? departmentData.id : null,
      phone_number: body.numero_telefono ?? "N/D",
      photo_url: body.url_foto_perfil ?? null,
      register_by_email: body.registrado_por_email ?? "N/D",
      title: body.titulo ?? "N/D",
      hourly_rates: body.honorarios_por_hora ?? true,
      hour_value: body.valor_hora ?? 0,
      category: body.categoria ?? "N/D",
      register_by_id: registerUser.id
    });
    if (userDBError) {
      console.error(userDBError);
      throw userDBError;
    };

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
        subject: `Registro de usuario exitoso en ${Deno.env.get("AION_NAME")}`,
        html: `<p>Hola ${body.display_name}</p><p>Has sido registrado en la plataforma de ${Deno.env.get("AION_NAME")}.</p><p>Su usuario es el correo electrónico ${body.email} y su contraseña provisional: <b>${clave}</b></p><p>Al iniciar sesión por primera vez se le solicitará cambiar la contraseña.</p><p>Para ingresar a la plataforma de ${Deno.env.get("AION_NAME")} puede ingresar a través del siguiente link: <a href="${Deno.env.get("AION_URL")}">${Deno.env.get("AION_NAME")}</a></p><p>Atentamente</p><p><b>El equipo de ${Deno.env.get("AION_NAME")}</b></p>`,
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
    res.status(201).json({ message: "Usuario creado correctamente." });
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