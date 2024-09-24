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
import { sign, verify } from 'npm:jsonwebtoken@9.0.2';

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

interface Company {
  code: string | null;
  color: string | null;
  created_at: string;
  company_name: string | null;
  director_id: string | null;
  icon: string | null;
  icon_dark: string | null;
  id: string;
  institution_id: string | null;
  seleccion_temp: boolean | null;
}


app.put('/auth/changePassword', async (req: express.Request, res: express.Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    let supabase;

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
})

app.post('/auth/confirmForgotPassword', async (req: express.Request, res: express.Response) => {    
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

    if (userRegister.tokenReset != body.token) {
      throw 'UNAUTHORIZED: El token de reseteo no coincide';
    }
    try {
      verify(body.token, Deno.env.get("SECRET_JWT"));
    } catch (_err) {
      console.error('Invalid token');
      throw 'UNAUTHORIZED: El token de reseteo no es correcto o expiró'
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
      .update({ first_login: true, tokenReset: null })
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
        subject: `Confirmación de Reestablecimiento de contraseña en ${Deno.env.get("AION_NAME")}`,
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
    res.status(201).send({ message: `Un correo con su contraseña provisional ha sido enviado a su correo electrónico ${body.email}.` });
  } catch (error) {
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

app.post('/auth/forgotPassword', async (req: express.Request, res: express.Response) => {    
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

    const { data: userRegister, error: userRegisterError } = await supabase.from("users").select().eq("email", body.email).limit(1).single();

    console.log("userRegister: ", userRegister)
    if (!userRegister) {
      console.error(userRegisterError);
      throw "NOT FOUND: El usuario no se encuentra registrado";
    }

    const user = {
      id: userRegister?.id,
      email: userRegister?.email,
      nombre: userRegister?.display_name
    }

    const token = sign(user, Deno.env.get("SECRET_JWT"), { expiresIn: '1h' });

    const { error: userChangedError } = await supabase
      .from("users")
      .update({ tokenReset: token })
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
        html: `<p>Hola ${user.nombre}</p><p>Se le ha enviado este email porque se solicitó un reseteo de contraseña en ${Deno.env.get("AION_NAME")}.</p><p>Si usted no lo solicitó puede hacer caso omiso a este email.</p><p>De lo contrario, puede hacer click en el link de abajo para confirmar el reseteo de la contraseña. Este enlace tiene una duración de 1 hora pasado este tiempo deberá solicitar un reseteo de contraseña nuevamente.</p><p>Puede confirmar a través del siguiente link: <a href="${Deno.env.get("AION_URL")}login?email=${user.email}&token=${token}">${Deno.env.get("AION_NAME")}</a></p><p>Atentamente</p><p><b>El equipo de ${Deno.env.get("AION_NAME")}</b></p>`,
      // deno-lint-ignore no-explicit-any
      }, (err: any, info: nodemailer.SentMessageInfo) => {
        if (err) {
          console.log(err);
          throw new Error(err);
          
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
    res.status(201).send({ message: `Un correo de confirmación ha sido enviado a su correo electrónico ${body.email}.` });
  } catch (error) {
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

app.post('/auth/signUp', async (req: express.Request, res: express.Response) => {  
  try {
    res.setHeader('Content-Type', 'application/json');

    let supabase;

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

    let companyData: Company = {
      code: null,
      color: null,
      created_at: "",
      company_name: null,
      director_id: null,
      icon: null,
      icon_dark: null,
      id: "",
      institution_id: null,
      seleccion_temp: null
    };

    if (body.company_id) {
      const { data: company, error: companyError } = await supabase.from("companies").select().eq("id", body.company_id).limit(1).single();
      if (companyError) {
        console.error(companyError);
        throw companyError;
      };
      companyData = company;
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
      company_id: body.company_id? companyData.id : null,
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
        html: `<p>Hola ${body.names} ${body.surnames}</p><p>Has sido registrado en la plataforma de ${Deno.env.get("AION_NAME")}.</p><p>Su usuario es el correo electrónico ${body.email} y su contraseña provisional: <b>${clave}</b></p><p>Al iniciar sesión por primera vez se le solicitará cambiar la contraseña.</p><p>Para ingresar a la plataforma de ${Deno.env.get("AION_NAME")} puede ingresar a través del siguiente link: <a href="${Deno.env.get("AION_URL")}">${Deno.env.get("AION_NAME")}</a></p><p>Atentamente</p><p><b>El equipo de ${Deno.env.get("AION_NAME")}</b></p>`,
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
    res.status(201).send({ message: "Usuario creado correctamente." });
  } catch (error) {
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

app.put('/auth/changeUserEmail', async (req: express.Request, res: express.Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    let supabase;

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

    if (!req.body.id) {
      throw "BAD REQUEST: No se proporcionó un id de usuario";
    } else if(!req.body.email) {
      throw "BAD REQUEST: No se proporcionó un email";
    }

    const body = req.body;

    const users = (await supabase.from("users").select().eq('email', body.email)).count;

    if (users != null && users > 0) {
      throw "CONFLICT: Ya se encuentra un usuario registrado con ese email.";
    }

    const supabase2 = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { error: userError } = await supabase2.auth.admin.updateUserById(
      `${body.id}`,
      { email: body.email, }
    );

    if (userError) {
      console.error(userError);
      throw new Error(userError.message);
    }

    const { error: userChangedError } = await supabase
      .from("users")
      .update({ email: body.email })
      .eq('id', body.id)

    if (userChangedError) {
      console.error(userChangedError);
      throw new Error (userChangedError.message);
    }

    console.log("OK");
    res.status(200).send({ message: "Email de usuario actualizado correctamente." });
  } catch (error) {
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