// @deno-types="npm:@types/morgan";
import morgan from "npm:morgan@1.10.0";

// @deno-types="npm:@types/express";
import express from "npm:express@4.18.3";

import nodemailer from "npm:nodemailer@6.9.14";
import { config } from "npm:dotenv@16.4.5";
import process from "node:process";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.1"
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

// Middleware CORS personalizado
/* app.use((req, res, next) => {
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
}); */

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

app.post('/notifications/customEmail', cors(corsOptions), async (req: express.Request, res: express.Response) => {  
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
  
    const transporter = nodemailer.createTransport({
      host: Deno.env.get("SENDGRID_HOST"),
      port: Deno.env.get("SENDGRID_PORT"),
      auth: {
        user: Deno.env.get("SENDGRID_USER"),
        pass: Deno.env.get("SENDGRID_API_KEY"),
      },
    });

    const { email, subject, html_format } = req.body;
    if (!email) {
      throw "BAD REQUEST: No se proporcionó email";
    }

    if (!subject) {
      throw "BAD REQUEST: No se proporcionó un asunto";
    }

    if (!html_format) {
      throw "BAD REQUEST: No se proporcionó un mensaje html";
    }

    try {
      transporter.sendMail({
        from: `${Deno.env.get("SENDGRID_SENDER_NAME")} ${Deno.env.get("SENDGRID_SENDER_EMAIL")}`,
        to: `${email}`,
        subject: `${subject}`,
        html: `${html_format}`,
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

    console.log("Correo electrónico enviado correctamente.");
    res.status(201).send({ message: "Correo electrónico enviado correctamente." });
  } catch (error) {
    console.log(JSON.stringify(error));
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

app.get('/notifications/actividades', cors(corsOptions), async (req: express.Request, res: express.Response) => {  
  try {
    res.setHeader('Content-Type', 'application/json');
  
    let supabase;
  
    let accessToken: string;
  
    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      // Primero tomar el token del header de autorizacion
      accessToken = req.headers.authorization!.replace('Bearer ', '');

      if (accessToken != Deno.env.get("SB_SERVICE_ROLE")!) {
        supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          global: {
            headers: { Authorization: req.headers.authorization! }
          }
        });
        // Verificar si el token es válido obteniendo los datos del usuario
        const { data: user, error } = await supabase.auth.getUser(accessToken);

        if (!accessToken) {
          throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
        }
        
        if (error || !user) {
          throw 'UNAUTHORIZED: Token de autorización inválido.';
        }
      } else {
        supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
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
    let notifPushCounterTotal = 0;
    let notifPushCounterOK = 0;
    let notifPushCounterFail = 0;

    // Definir las fechas
    const today = startOfDay(new Date());

    const dayBefore = startOfDay(new Date(today));
    dayBefore.setDate(dayBefore.getDate() + 1);

    const day2Before = startOfDay(new Date(today));
    day2Before.setDate(day2Before.getDate() + 2);

    // Consulta a Supabase para obtener actividades del día anterior
    const { data: actividadesAntesData, error: actividadesAntesDataError } = await supabase
      .from('actividades')
      .select('*')
      .eq("close", false)
      .eq('notif_push_pre', false)
      .gte("end_date_planned", dayBefore.toISOString())
      .lt("end_date_planned", day2Before.toISOString());

    if (actividadesAntesDataError) {
      console.error("Error al obtener las actividades:", actividadesAntesDataError);
    } else {
      console.log("Actividades del día anterior:", actividadesAntesData);
      for (const actividad of actividadesAntesData) {
        try {
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Prevencimiento",
              new: true,
              read: false,
              user_id: actividad.responsible_id,
              related_id: actividad.id,
              notification_title: "Actividad Por Vencer",
              notification_text: `Su actividad asignada '${actividad.activity_name}' vence mañana. Le recomendamos tomar las acciones pertinentes.`
            });
          notifPushCounterTotal++;
          if (pushDataError) {
            console.error("Error al guardar la notificacion push de la actividad:", pushDataError);
            notifPushCounterFail++;
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de prevencimiento de la actividad: ${actividad.activity_name} fue enviada correctamente`);
          const { error: notifActividadError } = await supabase
            .from('actividades')
            .update({
              notif_push_pre: true
            })
            .eq('id', actividad.id);
          if (notifActividadError) {
            console.error("Error al actualizar el estatus de la Notificación Push de prevencimiento de la actividad:", notifActividadError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    // Consulta a Supabase para obtener actividades del día actual
    const { data: actividadesActualData, error: actividadesActualDataError } = await supabase
      .from('actividades')
      .select('*')
      .eq("close", false)
      .eq('notif_push_exp', false)
      .gte("end_date_planned", today.toISOString())
      .lt("end_date_planned", dayBefore.toISOString());

    if (actividadesActualDataError) {
      console.error("Error al obtener las actividades:", actividadesActualDataError);
    } else {
      console.log("Actividades del día actual:", actividadesActualData);
      for (const actividad of actividadesActualData) {
        try {
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Vencimiento",
              new: true,
              read: false,
              user_id: actividad.responsible_id,
              related_id: actividad.id,
              notification_title: "Actividad Por Vencer",
              notification_text: `Su actividad asignada '${actividad.activity_name}' vence hoy. Le recomendamos tomar las acciones pertinentes.`
            })
          notifPushCounterTotal++;
          if (pushDataError) {
            console.error("Error al guardar la notificacion push de la actividad:", pushDataError);
            notifPushCounterFail++;
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de vencimiento de la actividad: ${actividad.activity_name} fue enviada correctamente`);
          const { error: notifActividadError } = await supabase
            .from('actividades')
            .update({
              notif_push_exp: true
            })
            .eq('id', actividad.id);
          if (notifActividadError) {
            console.error("Error al actualizar el estatus de la Notificación Push de vencimiento de la actividad:", notifActividadError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    // Consulta a Supabase para obtener actividades del día despues
    const { data: actividadesDespuesData, error: actividadesDespuesDataError } = await supabase
      .from('actividades')
      .select('*')
      .eq("close", false)
      .eq('notif_push_post', false)
      .lt("end_date_planned", today.toISOString());

    if (actividadesDespuesDataError) {
      console.error("Error al obtener las actividades:", actividadesDespuesDataError);
    } else {
      console.log("Actividades del día después:", actividadesDespuesData);
      for (const actividad of actividadesDespuesData) {
        const vencimiento = actividad.end_date_planned? startOfDay(new Date(actividad.end_date_planned)) : startOfDay(new Date());
        const opciones: Intl.DateTimeFormatOptions = { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        };
        
        const fechaFormateada = vencimiento.toLocaleDateString('es-ES', opciones);
        try {
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Postvencimiento",
              new: true,
              read: false,
              user_id: actividad.responsible_id,
              related_id: actividad.id,
              notification_title: "Actividad Vencida",
              notification_text: `Su actividad asignada '${actividad.activity_name}' venció el ${fechaFormateada}. Le recomendamos tomar las acciones pertinentes.`
            })
          notifPushCounterTotal++;
          if (pushDataError) {
            console.error("Error al guardar la notificacion push de la actividad:", pushDataError);
            notifPushCounterFail++;
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de postvencimiento de la actividad: ${actividad.activity_name} fue enviada correctamente`);
          const { error: notifActividadError } = await supabase
            .from('actividades')
            .update({
              notif_push_post: true
            })
            .eq('id', actividad.id);
          if (notifActividadError) {
            console.error("Error al actualizar el estatus de la Notificación Push de posvencimiento de la actividad:", notifActividadError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }
    if (notifPushCounterTotal == 0) {
      console.log('No hay notificaciones push pendientes para actividades.');
      res.status(201).send({ message: "No hay notificaciones push pendientes para actividades." });
    } else {
      console.log(`${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de actividades exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas.`);
      res.status(201).send({ message: `${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de actividades exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas.` })
    }
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

app.get('/notifications/tramites', cors(corsOptions), async (req: express.Request, res: express.Response) => {  
  try {
    res.setHeader('Content-Type', 'application/json');
  
    let supabase;
  
    let accessToken: string;
  
    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      // Primero tomar el token del header de autorizacion
      accessToken = req.headers.authorization!.replace('Bearer ', '')

      if (accessToken != Deno.env.get("SB_SERVICE_ROLE")) {
        supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          global: {
            headers: { Authorization: req.headers.authorization! }
          }
        });
        // Verificar si el token es válido obteniendo los datos del usuario
        const { data: user, error } = await supabase.auth.getUser(accessToken);

        if (!accessToken) {
          throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
        }
        
        if (error || !user) {
          throw 'UNAUTHORIZED: Token de autorización inválido.';
        }
      } else {
        supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
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

    let notifPushCounterTotal = 0;
    let notifPushCounterOK = 0;
    let notifPushCounterFail = 0;
    let notifEmailCounterTotal = 0;
    let notifEmailCounterOK = 0;
    let notifEmailCounterFail = 0;

    // Definir las fechas
    const today = startOfDay(new Date());

    const dayBefore = startOfDay(new Date(today));
    dayBefore.setDate(dayBefore.getDate() + 1);

    const day2Before = startOfDay(new Date(today));
    day2Before.setDate(day2Before.getDate() + 2);

    // Consulta a Supabase para obtener trámites del día anterior
    const { data: tramitesAntesData, error: tramitesAntesDataError } = await supabase
      .from('client_tramites')
      .select('*')
      .eq("close", false)
      .eq('notif_push_pre', false)
      .gte("end_date_planned", dayBefore.toISOString())
      .lt("end_date_planned", day2Before.toISOString());

    if (tramitesAntesDataError) {
      console.error("Error al obtener los trámites:", tramitesAntesDataError);
    } else {
      console.log("Trámites del día anterior:", tramitesAntesData);
      for (const tramite of tramitesAntesData) {
        try {
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Prevencimiento",
              new: true,
              read: false,
              user_id: tramite.responsible_id,
              related_id: tramite.id,
              notification_title: "Trámite Por Vencer",
              notification_text: `Su trámite asignado '${tramite.tramite_name}' vence mañana. Le recomendamos tomar las acciones pertinentes.`
            })
          notifPushCounterTotal++;
          if (pushDataError) {
            console.error("Error al guardar la notificacion push del trámite:", pushDataError);
            notifPushCounterFail++;
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de prevencimiento del tramite: ${tramite.tramite_name} fue enviada correctamente`);
          const { error: notifTramiteError } = await supabase
            .from('client_tramites')
            .update({
              notif_push_pre: true
            })
            .eq('id', tramite.id);
          if (notifTramiteError) {
            console.error("Error al actualizar el estatus de la Notificación Push de prevencimiento del tramite:", notifTramiteError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    // Consulta a Supabase para obtener trámites del día actual
    const { data: tramitesActualData, error: tramitesActualDataError } = await supabase
      .from('client_tramites')
      .select('*')
      .eq("close", false)
      .eq('notif_push_exp', false)
      .gte("end_date_planned", today.toISOString())
      .lt("end_date_planned", dayBefore.toISOString());

    if (tramitesActualDataError) {
      console.error("Error al obtener los trámites:", tramitesActualDataError);
    } else {
      console.log("Trámites del día actual:", tramitesActualData);
      for (const tramite of tramitesActualData) {
        try {
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Vencimiento",
              new: true,
              read: false,
              user_id: tramite.responsible_id,
              related_id: tramite.id,
              notification_title: "Trámite Por Vencer",
              notification_text: `Su trámite asignado ${tramite.tramite_name} vence hoy. Le recomendamos tomar las acciones pertinentes.`
            })
          notifPushCounterTotal++;
          if (pushDataError) {
            notifPushCounterFail++;
            console.error("Error al guardar la notificacion push del trámite:", pushDataError);
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de vencimiento del tramite: ${tramite.tramite_name} fue enviada correctamente`);
          const { error: notifTramiteError } = await supabase
            .from('client_tramites')
            .update({
              notif_push_exp: true
            })
            .eq('id', tramite.id);
          if (notifTramiteError) {
            console.error("Error al actualizar el estatus de la Notificación Push de vencimiento del tramite:", notifTramiteError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    // Consulta a Supabase para obtener actividades del día despues
    const { data: tramitesDespuesData, error: tramitesDespuesDataError } = await supabase
      .from('client_tramites')
      .select('*')
      .eq("close", false)
      .or('notif_email_post.eq.false, notif_push_post.eq.false, notif_push_admin_post.eq.false')
      .lt("end_date_planned", today.toISOString());

    if (tramitesDespuesDataError) {
      console.error("Error al obtener los trámites:", tramitesDespuesDataError);
    } else {
      console.log("Trámites del día después:", tramitesDespuesData);
      const transporter = nodemailer.createTransport({
        host: Deno.env.get("SENDGRID_HOST"),
        port: Deno.env.get("SENDGRID_PORT"),
        auth: {
          user: Deno.env.get("SENDGRID_USER"),
          pass: Deno.env.get("SENDGRID_API_KEY"),
        },
      });
      for (const tramite of tramitesDespuesData) {
        const vencimiento = tramite.end_date_planned? startOfDay(new Date(tramite.end_date_planned)) : startOfDay(new Date());
        const opciones: Intl.DateTimeFormatOptions = { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        };
        
        const fechaFormateada = vencimiento.toLocaleDateString('es-ES', opciones);
        try {
          const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('*')
            .eq('id', tramite.responsible_id!)
            .single();
          if (userDataError) {
            console.error("Error el usuario para enviar el email del trámite:", userDataError);
            continue;
          }
          const { data: adminData, error: adminDataError } = await supabase
            .from('users')
            .select('id, email, display_name')
            .eq('rol_name', 'Administrador')
          if (adminDataError) {
            console.error("Error al obtener los administradores para enviar el email del trámite:", adminDataError);
            continue;
          }

          // Asegurarse de que adminData no sea null y sea un arreglo
          if (!adminData || !Array.isArray(adminData)) {
            console.error("No se encontraron administradores para enviar el email del trámite.");
            continue;
          }

          // Extraer los emails y filtrar cualquier valor nulo o inválido
          const adminEmails = adminData
            .map(admin => admin.email)
            .filter((email): email is string => typeof email === 'string' && email.includes('@'));

          if (adminEmails.length === 0) {
            console.error("No hay direcciones de correo electrónico válidas de administradores para enviar el email.");
            continue;
          }
          // Verificar que userData.email exista y sea válido
          if (!userData.email || !userData.email.includes('@')) {
            console.error("El usuario no tiene una dirección de correo electrónico válida.");
            continue;
          }

          // Opcional: Usar BCC para mantener las direcciones de los administradores ocultas entre sí
          const mailOptions = {
            from: `${Deno.env.get("SENDGRID_SENDER_NAME")} <${Deno.env.get("SENDGRID_SENDER_EMAIL")}>`,
            to: userData.email, // Enviar directamente al usuario
            bcc: adminEmails.join(', '), // Enviar a los administradores en BCC
            subject: `Trámite Vencido`,
            html: `
              <h2>TRÁMITE VENCIDO</h2>
              <p>El trámite <strong>${tramite.tramite_name}</strong> asignado al usuario <strong>${userData.display_name}</strong> venció el <strong>${fechaFormateada}</strong>. Le recomendamos tomar las acciones pertinentes.</p>
              <p>Muchas gracias</p>
              <p>Atentamente,</p>
              <p><b>El equipo de ${Deno.env.get("AION_NAME")}</b></p>
            `,
          };
          try {
            if (tramite.notif_email_post == false) {
              notifEmailCounterTotal++;
              const info = await transporter.sendMail(mailOptions);
              console.log("Correo enviado exitosamente:", info);
              notifEmailCounterOK++;
              const { error: notifTramiteError } = await supabase
                .from('client_tramites')
                .update({
                  notif_email_post: true
                })
                .eq('id', tramite.id);
              if (notifTramiteError) {
                console.error("Error al actualizar el estatus de la Notificación Email de posvencimiento del tramite:", notifTramiteError);
                continue;
              }
            }
          } catch (error) {
            console.error("Error al enviar el correo:", error);
            notifEmailCounterFail++;
            continue;
          }
          if (tramite.notif_push_post == false) {
            const { error: pushDataError } = await supabase
              .from("notifications_push")
              .insert({
                email: true,
                category: "Postvencimiento",
                new: true,
                read: false,
                user_id: tramite.responsible_id,
                related_id: tramite.id,
                notification_title: "Trámite Vencido",
                notification_text: `Su trámite asignado ${tramite.tramite_name} venció el ${fechaFormateada}. Le recomendamos tomar las acciones pertinentes.`
              });
            notifPushCounterTotal++;
            if (pushDataError) {
              notifPushCounterFail++;
              console.error("Error al guardar la notificacion push del trámite:", pushDataError);
              continue;
            }
            notifPushCounterOK++;
            console.log(`Notificación Push de postvencimiento del tramite: ${tramite.tramite_name} fue enviada correctamente`);
            const { error: notifTramiteError } = await supabase
              .from('client_tramites')
              .update({
                notif_push_post: true
              })
              .eq('id', tramite.id);
            if (notifTramiteError) {
              console.error("Error al actualizar el estatus de la Notificación Push de posvencimiento del tramite:", notifTramiteError);
              continue;
            }
          }
          if (tramite.notif_push_admin_post == false) {
            for (const admin of adminData) {
              const { error: pushDataError } = await supabase
                .from("notifications_push")
                .insert({
                  email: false,
                  category: "Postvencimiento",
                  new: true,
                  read: false,
                  user_id: admin.id,
                  related_id: tramite.id,
                  notification_title: "Trámite Vencido",
                  notification_text: `El trámite ${tramite.tramite_name} asignado a ${userData.display_name} venció el ${fechaFormateada}. Le recomendamos tomar las acciones pertinentes.`
                })
              notifPushCounterTotal++;
              if (pushDataError) {
                notifPushCounterFail++;
                console.error("Error al guardar la notificacion push del trámite:", pushDataError);
                continue;
              }
              notifPushCounterOK++;
              console.log(`Notificación Push de postvencimiento del tramite: ${tramite.tramite_name} para el admin ${admin.display_name} fue enviada correctamente`);
            }
            const { error: notifTramiteError } = await supabase
              .from('client_tramites')
              .update({
                notif_push_admin_post: true
              })
              .eq('id', tramite.id);
            if (notifTramiteError) {
              console.error("Error al actualizar el estatus de la Notificación Push de posvencimiento de Admin del tramite:", notifTramiteError);
              continue;
            }
          }
        } catch (error) {
          console.error("Error al enviar el correo:", error);
          throw new Error(error);
        }
      }
    }

    let message: string;

    if (notifPushCounterTotal == 0) {
      console.log('No hay notificaciones push pendientes para trámites.');
      message = 'No hay notificaciones push pendientes para trámites ';
    } else {
      console.log(`${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de trámites exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas.`);
      message = `${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de trámites exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas `;
    }

    if (notifEmailCounterTotal == 0) {
      console.log('No hay notificaciones email pendientes para trámites.');
      message += 'y no hay notificaciones email pendientes para trámites.';
    } else {
      console.log(`${notifEmailCounterOK == 0? 'No hubo': `y hubo ${notifEmailCounterOK}`} notificaciones email de trámites exitosas y ${notifEmailCounterFail == 0 ? 'ningunas' : notifEmailCounterFail} fallidas.`);
      message += `${notifEmailCounterOK == 0? 'y no hubo': `y hubo ${notifEmailCounterOK}`} notificaciones email de trámites exitosas y ${notifEmailCounterFail == 0 ? 'ningunas' : notifEmailCounterFail} fallidas.`;
    }

    res.status(201).send({ message });
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

app.get('/notifications/cajachica', cors(corsOptions), async (req: express.Request, res: express.Response) => {  
  try {
    res.setHeader('Content-Type', 'application/json');
  
    let supabase;
  
    let accessToken: string;
  
    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      // Primero tomar el token del header de autorizacion
      accessToken = req.headers.authorization!.replace('Bearer ', '')

      if (accessToken != Deno.env.get("SB_SERVICE_ROLE")) {
        supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          global: {
            headers: { Authorization: req.headers.authorization! }
          }
        });
        // Verificar si el token es válido obteniendo los datos del usuario
        const { data: user, error } = await supabase.auth.getUser(accessToken);

        if (!accessToken) {
          throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
        }
        
        if (error || !user) {
          throw 'UNAUTHORIZED: Token de autorización inválido.';
        }
      } else {
        supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
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

    let notifPushCounterTotal = 0;
    let notifPushCounterOK = 0;
    let notifPushCounterFail = 0;
    let notifEmailCounterTotal = 0;
    let notifEmailCounterOK = 0;
    let notifEmailCounterFail = 0;

    // Definir las fechas
    const today = startOfDay(new Date());

    const tenDaysAgo = startOfDay(new Date(today));
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Consulta a Supabase para obtener la Caja Chica de hace 10 días
    const { data: cajaChicaData, error: cajaChicaDataError } = await supabase
      .from('caja_chica_registros')
      .select('*')
      .eq("client_liquidation", false)
      .or('notif_push_pre.eq.false, notif_email_pre.eq.false')
      .lte("date", tenDaysAgo.toISOString());

    if (cajaChicaDataError) {
      console.error("Error al obtener los registros de caja chica:", cajaChicaDataError);
    } else {
      console.log("Caja chica de hace 10 días:", cajaChicaData);
      const transporter = nodemailer.createTransport({
        host: Deno.env.get("SENDGRID_HOST"),
        port: Deno.env.get("SENDGRID_PORT"),
        auth: {
          user: Deno.env.get("SENDGRID_USER"),
          pass: Deno.env.get("SENDGRID_API_KEY"),
        },
      });
      for (const cajaChica of cajaChicaData) {
        const vencimiento = cajaChica.date? startOfDay(new Date(cajaChica.date)) : startOfDay(new Date());
        const opciones: Intl.DateTimeFormatOptions = { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        };
        
        const fechaFormateada = vencimiento.toLocaleDateString('es-ES', opciones);
        try {
          const { data: supervisorData, error: supervisorDataError } = await supabase
            .from('users')
            .select('id, email, display_name')
            .eq('rol_name', 'Supervisor')
          if (supervisorDataError) {
            console.error("Error al obtener los supervisores para enviar el email del registro de caja chica.", supervisorDataError);
            continue;
          }

          // Asegurarse de que adminData no sea null y sea un arreglo
          if (!supervisorData || !Array.isArray(supervisorData)) {
            console.error("No se encontraron supervisores para enviar el email del registro de caja chica.");
            continue;
          }

          // Extraer los emails y filtrar cualquier valor nulo o inválido
          const supervisorEmails = supervisorData
            .map(supervisor => supervisor.email)
            .filter((email): email is string => typeof email === 'string' && email.includes('@'));

          if (supervisorEmails.length === 0) {
            console.error("No hay direcciones de correo electrónico válidas de supervisores para enviar el email.");
            continue;
          }

          // Opcional: Usar BCC para mantener las direcciones de los supervisores ocultas entre sí
          const mailOptions = {
            from: `${Deno.env.get("SENDGRID_SENDER_NAME")} <${Deno.env.get("SENDGRID_SENDER_EMAIL")}>`,
            bcc: supervisorEmails.join(', '), // Enviar a los supervisores en BCC
            subject: `Caja Chica Sin Liquidar`,
            html: `
              <h2>CAJA CHICA SIN LIQUIDAR</h2>
              <p>La caja chica por concepto <strong>${cajaChica.concept}</strong> de fecha <strong>${fechaFormateada}</strong> aún no ha sido liquidada. Le recomendamos tomar las acciones pertinentes.</p>
              <p>Muchas gracias</p>
              <p>Atentamente,</p>
              <p><b>El equipo de ${Deno.env.get("AION_NAME")}</b></p>
            `,
          };
          try {
            if (cajaChica.notif_email_pre == false) {
              notifEmailCounterTotal++;
              const info = await transporter.sendMail(mailOptions);
              console.log("Correo enviado exitosamente:", info);
              notifEmailCounterOK++;
              const { error: notifCajaChicaError } = await supabase
                .from('caja_chica_registros')
                .update({
                  notif_email_pre: true
                })
                .eq('id', cajaChica.id);
              if (notifCajaChicaError) {
                console.error("Error al actualizar el estatus de la Notificación Email de 10 días de antelación de caja chica:", notifCajaChicaError);
                continue;
              }
            }
          } catch (error) {
            notifEmailCounterFail++;
            console.error("Error al enviar el correo:", error);
            continue;
          }
          if (cajaChica.notif_push_pre == false) {
            for (const supervisor of supervisorData) {
              const { error: pushDataError } = await supabase
                .from("notifications_push")
                .insert({
                  email: true,
                  category: "Caja Chica No Liquidada",
                  new: true,
                  read: false,
                  user_id: supervisor.id,
                  related_id: cajaChica.id,
                  notification_title: "Caja Chica Sin Liquidar",
                  notification_text: `La caja chica por concepto de ${cajaChica.concept} de ${fechaFormateada} aún no ha sido liquidada. Le recomendamos tomar las acciones pertinentes.`
                })
              notifPushCounterTotal++;
              if (pushDataError) {
                notifPushCounterFail++;
                console.error("Error al guardar la notificacion push del registro de caja chica:", pushDataError);
                continue;
              }
              notifPushCounterOK++;
              console.log(`Notificación Push de 10 días de antelación de caja chica: ${cajaChica.concept} al supervisor ${supervisor.display_name} fue enviada correctamente`);
            }
            const { error: notifCajaChicaError } = await supabase
              .from('caja_chica_registros')
              .update({
                notif_push_pre: true
              })
              .eq('id', cajaChica.id);
            if (notifCajaChicaError) {
              console.error("Error al actualizar el estatus de la Notificación Push de 10 días de antelación de caja chica:", notifCajaChicaError);
              continue;
            }
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    let message: string;

    if (notifPushCounterTotal == 0) {
      console.log('No hay notificaciones push pendientes para caja chica.');
      message = 'No hay notificaciones push pendientes para caja chica ';
    } else {
      console.log(`${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de caja chica exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas.`);
      message = `${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de caja chica exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas `;
    }

    if (notifEmailCounterTotal == 0) {
      console.log('No hay notificaciones email pendientes para caja chica.');
      message += 'y no hay notificaciones email pendientes para caja chica.';
    } else {
      console.log(`${notifEmailCounterOK == 0? 'No hubo': `y hubo ${notifEmailCounterOK}`} notificaciones email de caja chica exitosas y ${notifEmailCounterFail == 0 ? 'ningunas' : notifEmailCounterFail} fallidas.`);
      message += `${notifEmailCounterOK == 0? 'y no hubo': `y hubo ${notifEmailCounterOK}`} notificaciones email de caja chica exitosas y ${notifEmailCounterFail == 0 ? 'ningunas' : notifEmailCounterFail} fallidas.`;
    }
    res.status(201).send({ message });
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

app.get('/notifications/factura', cors(corsOptions), async (req: express.Request, res: express.Response) => {  
  try {
    res.setHeader('Content-Type', 'application/json');
  
    let supabase;
  
    let accessToken: string;
  
    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      // Primero tomar el token del header de autorizacion
      accessToken = req.headers.authorization!.replace('Bearer ', '')

      if (accessToken != Deno.env.get("SB_SERVICE_ROLE")) {
        supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          global: {
            headers: { Authorization: req.headers.authorization! }
          }
        });
        // Verificar si el token es válido obteniendo los datos del usuario
        const { data: user, error } = await supabase.auth.getUser(accessToken);

        if (!accessToken) {
          throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
        }
        
        if (error || !user) {
          throw 'UNAUTHORIZED: Token de autorización inválido.';
        }
      } else {
        supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
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

    let notifPushCounterTotal = 0;
    let notifPushCounterOK = 0;
    let notifPushCounterFail = 0;
    let notifEmailCounterTotal = 0;
    let notifEmailCounterOK = 0;
    let notifEmailCounterFail = 0;

    // Definir las fechas
    const today = startOfDay(new Date());

    const tenDaysAgo = startOfDay(new Date(today));
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Consulta a Supabase para obtener los registros facturables de hace 10 días
    const { data: regFacturableData, error: regFacturableDataError } = await supabase
      .from('reg_facturable')
      .select('*')
      .eq("is_liquidated", false)
      .or("notif_push_pre.eq.false, notif_email_pre.eq.false")
      .lte("created_at", tenDaysAgo.toISOString());

    if (regFacturableDataError) {
      console.error("Error al obtener los registros facturables:", regFacturableDataError);
    } else {
      console.log("Registros facturables de hace 10 días:", regFacturableData);
      const transporter = nodemailer.createTransport({
        host: Deno.env.get("SENDGRID_HOST"),
        port: Deno.env.get("SENDGRID_PORT"),
        auth: {
          user: Deno.env.get("SENDGRID_USER"),
          pass: Deno.env.get("SENDGRID_API_KEY"),
        },
      });
      for (const registroFacturable of regFacturableData) {
        const vencimiento = registroFacturable.created_at? startOfDay(new Date(registroFacturable.created_at)) : startOfDay(new Date());
        const opciones: Intl.DateTimeFormatOptions = { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        };
        
        const fechaFormateada = vencimiento.toLocaleDateString('es-ES', opciones);
        try {
          const { data: supervisorData, error: supervisorDataError } = await supabase
            .from('users')
            .select('id, email, display_name')
            .eq('rol_name', 'Supervisor')
          if (supervisorDataError) {
            console.error("Error al obtener los supervisores para enviar el email del registro facturable.", supervisorDataError);
            continue;
          }

          // Asegurarse de que adminData no sea null y sea un arreglo
          if (!supervisorData || !Array.isArray(supervisorData)) {
            console.error("No se encontraron supervisores para enviar el email del registro facturable.");
            continue;
          }

          // Extraer los emails y filtrar cualquier valor nulo o inválido
          const supervisorEmails = supervisorData
            .map(supervisor => supervisor.email)
            .filter((email): email is string => typeof email === 'string' && email.includes('@'));

          if (supervisorEmails.length === 0) {
            console.error("No hay direcciones de correo electrónico válidas de supervisores para enviar el email.");
            continue;
          }

          // Opcional: Usar BCC para mantener las direcciones de los supervisores ocultas entre sí
          const mailOptions = {
            from: `${Deno.env.get("SENDGRID_SENDER_NAME")} <${Deno.env.get("SENDGRID_SENDER_EMAIL")}>`,
            bcc: supervisorEmails.join(', '), // Enviar a los supervisores en BCC
            subject: `Registro Facturable Sin Liquidar`,
            html: `
              <h2>REGISTRO FACTURABLE SIN LIQUIDAR</h2>
              <p>El registro facturable por concepto <strong>${registroFacturable.activity}</strong> de fecha <strong>${fechaFormateada}</strong> aún no ha sido liquidado. Le recomendamos tomar las acciones pertinentes.</p>
              <p>Muchas gracias</p>
              <p>Atentamente,</p>
              <p><b>El equipo de ${Deno.env.get("AION_NAME")}</b></p>
            `,
          };
          try {
            if (registroFacturable.notif_email_pre == false) {
              notifEmailCounterTotal++;
              const info = await transporter.sendMail(mailOptions);
              console.log("Correo enviado exitosamente:", info);
              notifEmailCounterOK++;
              const { error: notifRegFacturableError } = await supabase
                .from('reg_facturable')
                .update({
                  notif_email_pre: true
                })
                .eq('id', registroFacturable.id);
              if (notifRegFacturableError) {
                console.error("Error al actualizar el estatus de la Notificación Email de 10 días de antelación del registro facturable:", notifRegFacturableError);
                continue;
              }
            }
          } catch (error) {
            notifEmailCounterFail++;
            console.error("Error al enviar el correo:", error);
            continue;
          }
          if (registroFacturable.notif_push_pre == false) {
            for (const supervisor of supervisorData) {
              const { error: pushDataError } = await supabase
                .from("notifications_push")
                .insert({
                  email: true,
                  category: "Registro Facturable No Liquidado",
                  new: true,
                  read: false,
                  user_id: supervisor.id,
                  related_id: registroFacturable.id,
                  notification_title: "Registro Facturable Sin Liquidar",
                  notification_text: `El registro facturable por concepto de ${registroFacturable.activity} de ${fechaFormateada} aún no ha sido liquidado. Le recomendamos tomar las acciones pertinentes.`
                })
              notifPushCounterTotal++;
              if (pushDataError) {
                notifPushCounterFail++;
                console.error("Error al guardar la notificacion push del registro facturable:", pushDataError);
                continue;
              }
              notifPushCounterOK++;
              console.log(`Notificación Push de 10 días de antelación de registro facturable: ${registroFacturable.activity} al supervisor ${supervisor.display_name} fue enviada correctamente`);
            }
            const { error: notifRegFacturableError } = await supabase
              .from('reg_facturable')
              .update({
                notif_push_pre: true
              })
              .eq('id', registroFacturable.id);
            if (notifRegFacturableError) {
              console.error("Error al actualizar el estatus de la Notificación Push de 10 días de antelación de registro facturable:", notifRegFacturableError);
              continue;
            }
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    let message: string;

    if (notifPushCounterTotal == 0) {
      console.log('No hay notificaciones push pendientes para registros facturables.');
      message = 'No hay notificaciones push pendientes para registros facturables ';
    } else {
      console.log(`${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de registros facturables exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas.`);
      message = `${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de registros facturables exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas `;
    }

    if (notifEmailCounterTotal == 0) {
      console.log('No hay notificaciones email pendientes para registros facturables.');
      message += 'y no hay notificaciones email pendientes para registros facturables.';
    } else {
      console.log(`${notifEmailCounterOK == 0? 'No hubo': `y hubo ${notifEmailCounterOK}`} notificaciones email de registros facturables exitosas y ${notifEmailCounterFail == 0 ? 'ningunas' : notifEmailCounterFail} fallidas.`);
      message += `${notifEmailCounterOK == 0? 'y no hubo': `y hubo ${notifEmailCounterOK}`} notificaciones email de registros facturables exitosas y ${notifEmailCounterFail == 0 ? 'ningunas' : notifEmailCounterFail} fallidas.`;
    }
    res.status(201).send({ message });
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

app.get('/notifications/habilitantes', cors(corsOptions), async (req: express.Request, res: express.Response) => {  
  try {
    res.setHeader('Content-Type', 'application/json');
  
    let supabase;
  
    let accessToken: string;
  
    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY") && !req.body.test) {
      console.log("ENTORNO: PRODUCCIÓN");
      // Primero tomar el token del header de autorizacion
      accessToken = req.headers.authorization!.replace('Bearer ', '')

      if (accessToken != Deno.env.get("SB_SERVICE_ROLE")) {
        supabase = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          global: {
            headers: { Authorization: req.headers.authorization! }
          }
        });
        // Verificar si el token es válido obteniendo los datos del usuario
        const { data: user, error } = await supabase.auth.getUser(accessToken);

        if (!accessToken) {
          throw `FORBIDDEN: Prohibido: Falta el token de autenticación.`;
        }
        
        if (error || !user) {
          throw 'UNAUTHORIZED: Token de autorización inválido.';
        }
      } else {
        supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
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

    let notifPushCounterTotal = 0;
    let notifPushCounterOK = 0;
    let notifPushCounterFail = 0;

    // Definir las fechas
    const today = startOfDay(new Date());

    const dayBefore = startOfDay(new Date(today));
    dayBefore.setDate(dayBefore.getDate() + 1);

    const day2Before = startOfDay(new Date(today));
    day2Before.setDate(day2Before.getDate() + 2);

    // Consulta a Supabase para obtener habilitantes del día anterior
    const { data: habilitantesAntesData, error: habilitantesAntesDataError } = await supabase
      .from('habilitantes')
      .select('*')
      .eq('notif_push_pre', false)
      .gte("exp_date", dayBefore.toISOString())
      .lt("exp_date", day2Before.toISOString());

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*');
      
    if (userError) {
      console.error("Error al obtener usuarios:", userError);
    }

    if (habilitantesAntesDataError) {
      console.error("Error al obtener las habilitantes:", habilitantesAntesDataError);
    } else {
      console.log("Habilitantes del día anterior:", habilitantesAntesData);
      for (const habilitante of habilitantesAntesData) {
        try {
          const userClient = userData?.findLast((user) => user.client_id == habilitante.client_id);
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Prevencimiento",
              new: true,
              read: false,
              user_id: userClient?.id || null,
              related_id: habilitante.id,
              notification_title: "Habilitante Por Vencer",
              notification_text: `Su habilitante asignada '${habilitante.habilitantes_name}' vence mañana. Le recomendamos tomar las acciones pertinentes.`
            })
          notifPushCounterTotal++;
          if (pushDataError) {
            notifPushCounterFail++;
            console.error("Error al guardar la notificacion push de la habilitante:", pushDataError);
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de prevencimiento de la habilitante: ${habilitante.habilitantes_name} fue enviada correctamente`);
          const { error: notifHabilitanteError } = await supabase
            .from('habilitantes')
            .update({
              notif_push_pre: true
            })
            .eq('id', habilitante.id);
          if (notifHabilitanteError) {
            console.error("Error al actualizar el estatus de la Notificación Push de prevencimiento de la habilitante:", notifHabilitanteError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    // Consulta a Supabase para obtener habilitantes del día actual
    const { data: habilitantesActualData, error: habilitantesActualDataError } = await supabase
      .from('habilitantes')
      .select('*')
      .eq('notif_push_exp', false)
      .gte("exp_date", today.toISOString())
      .lt("exp_date", dayBefore.toISOString());

    if (habilitantesActualDataError) {
      console.error("Error al obtener las habilitantes:", habilitantesActualDataError);
    } else {
      console.log("Habilitantes del día actual:", habilitantesActualData);
      for (const habilitante of habilitantesActualData) {
        try {
          const userClient = userData?.findLast((user) => user.client_id == habilitante.client_id);
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Vencimiento",
              new: true,
              read: false,
              user_id: userClient?.id || null,
              related_id: habilitante.id,
              notification_title: "Habilitante Por Vencer",
              notification_text: `Su habilitante asignada '${habilitante.habilitantes_name}' vence hoy. Le recomendamos tomar las acciones pertinentes.`
            })
            notifPushCounterTotal++;
          if (pushDataError) {
            notifPushCounterFail++;
            console.error("Error al guardar la notificacion push de la habilitante:", pushDataError);
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de vencimiento de la habilitante: ${habilitante.habilitantes_name} fue enviada correctamente`);
          const { error: notifHabilitanteError } = await supabase
            .from('habilitantes')
            .update({
              notif_push_exp: true
            })
            .eq('id', habilitante.id);
          if (notifHabilitanteError) {
            console.error("Error al actualizar el estatus de la Notificación Push de vencimiento de la habilitante:", notifHabilitanteError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    // Consulta a Supabase para obtener habilitantes del día despues
    const { data: habilitantesDespuesData, error: habilitantesDespuesDataError } = await supabase
      .from('habilitantes')
      .select('*')
      .eq("notif_push_post", false)
      .lt("exp_date", today.toISOString());

    if (habilitantesDespuesDataError) {
      console.error("Error al obtener las habilitantes:", habilitantesDespuesDataError);
    } else {
      console.log("Habilitantes del día después:", habilitantesDespuesData);
      for (const habilitante of habilitantesDespuesData) {
        const vencimiento = habilitante.exp_date? startOfDay(new Date(habilitante.exp_date)) : startOfDay(new Date());
        const opciones: Intl.DateTimeFormatOptions = { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        };
        
        const fechaFormateada = vencimiento.toLocaleDateString('es-ES', opciones);
        try {
          const userClient = userData?.findLast((user) => user.client_id == habilitante.client_id);
          const { error: pushDataError } = await supabase
            .from("notifications_push")
            .insert({
              email: false,
              category: "Postvencimiento",
              new: true,
              read: false,
              user_id: userClient?.id || null,
              related_id: habilitante.id,
              notification_title: "Habilitante Vencida",
              notification_text: `Su habilitante asignada '${habilitante.habilitantes_name}' venció el ${fechaFormateada}. Le recomendamos tomar las acciones pertinentes.`
            })
          notifPushCounterTotal++;
          if (pushDataError) {
            notifPushCounterFail++;
            console.error("Error al guardar la notificacion push de la habilitante:", pushDataError);
            continue;
          }
          notifPushCounterOK++;
          console.log(`Notificación Push de posvencimiento de la habilitante: ${habilitante.habilitantes_name} fue enviada correctamente`);
          const { error: notifHabilitanteError } = await supabase
            .from('habilitantes')
            .update({
              notif_push_post: true
            })
            .eq('id', habilitante.id);
          if (notifHabilitanteError) {
            console.error("Error al actualizar el estatus de la Notificación Push de posvencimiento de la habilitante:", notifHabilitanteError);
            continue;
          }
        } catch (error) {
          throw new Error(error);
        }
      }
    }

    if (notifPushCounterTotal == 0) {
      console.log('No hay notificaciones push pendientes para habilitantes.');
      res.status(201).send({ message: "No hay notificaciones push pendientes para habilitantes." });
    } else {
      console.log(`${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de habilitantes exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas.`);
      res.status(201).send({ message: `${notifPushCounterOK == 0? 'No hubo': `Hubo ${notifPushCounterOK}`} notificaciones push de habilitantes exitosas y ${notifPushCounterFail == 0 ? 'ningunas' : notifPushCounterFail} fallidas.` })
    }
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

/**
 * Función para establecer una fecha al inicio del día (00:00)
 * @param date Fecha a transformar
 * @return Fecha transformada en 00:00
 */
function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}
