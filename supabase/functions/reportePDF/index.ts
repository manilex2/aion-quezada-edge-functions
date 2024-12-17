// @deno-types="npm:@types/morgan";
import morgan from "npm:morgan@1.10.0";

// @deno-types="npm:@types/express";
import express from "npm:express@4.18.3";

import { config } from "npm:dotenv@16.4.5";
import process from "node:process";
import { Buffer } from "node:buffer";
import { SupabaseClient, createClient } from "https://esm.sh/@supabase/supabase-js@2.44.1"
import { Database } from "../database.types.ts";
// @deno-types="npm:@types/luxon";
import { DateTime } from "npm:luxon@3.5.0";
// import { getCorsHeaders } from '../_shared/cors.ts';
// @deno-types="npm:@types/cors";
import cors, { CorsOptions } from "npm:cors";
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage, PDFFont } from "npm:pdf-lib@1.17.1";

const PORT = process.env.PORT || 3000;

config();

const app = express();
app.use(morgan("dev"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// app.use(cors());

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

app.post('/reportePDF/reportePDFRegFac', cors(corsOptions), async (req: express.Request, res: express.Response) => { 
  try {
    let supabase: SupabaseClient;

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

    // Obtener la lista de IDs desde el body de la solicitud
    const { ids, client_id, caso_id, liquidator_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw "BAD REQUEST: No se proporcionaron IDs válidos";
    }

    if (!client_id || !caso_id || !liquidator_id) {
      throw "BAD REQUEST: No se proporcionaron client_id o caso_id o liquidator_id";
    }

    // Obtener el nombre del caso desde client_casos
    const { data: casoData, error: casoError } = await supabase
      .from("client_casos")
      .select("case_name")
      .eq("id", caso_id)
      .single();

    if (casoError) {
      throw casoError;
    }

    const nombre_caso = casoData.case_name || "Caso desconocido";

    // Obtener el RUC del cliente desde client
    const { data: clientData, error: clientError } = await supabase
      .from("client")
      .select("id_number")
      .eq("id", client_id)
      .single();

    if (clientError) {
      throw clientError;
    }

    const ruc_cliente = clientData.id_number || "RUC desconocido";

    // Obtener la fecha actual en formato "MM-YYYY"
    const fechaActual = DateTime.now().setZone("America/Guayaquil");
    const fechaFormateada = formatDateToMonthYear(fechaActual.toISO());

    // Generar el código base concatenado
    const codigoBase = `RFL-${ruc_cliente}-${fechaFormateada}`;

    // Buscar registros que coincidan con el prefijo en la tabla reg_facturable_liq
    const { data: registrosExistentes, error: registrosError } = await supabase
      .from("reg_facturable_liq")
      .select("liq_code")
      .like("liq_code", `${codigoBase}%`);

    if (registrosError) {
      throw registrosError;
    }

    // Determinar el siguiente secuencial
    const secuencial = registrosExistentes.length + 1;
    const secuencialFormateado = String(secuencial).padStart(3, '0');

    // Generar el código final con secuencial
    const codigoFinal = `${codigoBase}-${secuencialFormateado}`;

    // Filtra los datos relevantes de reg_facturable
    const { data: regFacturable, error: regFacturableError } = await supabase
      .from("reg_facturable")
      .select("*")
      .eq("is_liquidated", false)
      .in("id", ids);

    if (regFacturableError) {
      throw regFacturableError;
    }

    if (!regFacturable || regFacturable.length === 0) {
      throw "NOT FOUND: No se encontraron datos";
    }

    // Obtener los nombres de usuario correspondientes
    const userIds = regFacturable.map(row => row.register_by_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", userIds);

    if (usersError) {
      throw usersError;
    }

    const userMap = new Map(users.map(user => [user.id, user.display_name]));

    // Construir los datos para el PDF
    const data: RowData[] = regFacturable.map(row => ({
      fecha: formatDate(row.start_date_time)?? "",
      descripcion: row.details?? "",
      nombre_usuario: row.register_by_id ? userMap.get(row.register_by_id) || "Usuario desconocido" : "Usuario desconocido",
      inicio: formatHour(row.start_date_time)?? "",
      final: formatHour(row.end_date_time)?? "",
      horasTrabajadas: formatDuration(row.duration_real)?? "",
      horasFacturables: formatDuration(row.duration_to_bill)?? "",
      valor: formatValue(row.total_value)?? "",
      tarifaHora: formatValue(row.hour_value)?? ""
    }));

    // Generar el PDF
    const bucket = 'assets';
    const path = 'landing/under_construction/logo_quezada.png';
    // Obtén la imagen desde Supabase Storage
    const { data: logoData, error: errorLogoData } = await supabase
    .storage
    .from(bucket)
    .download(path);

    if (errorLogoData) {
      throw errorLogoData;
    }

    // Convierte el Blob a ArrayBuffer
    const arrayBuffer = await logoData.arrayBuffer();
    // Convierte el ArrayBuffer en un Uint8Array
    const logo = new Uint8Array(arrayBuffer);

    // Calcular duration_total y value_total
    const duration_total = regFacturable.reduce((sum, row) => sum + (row.duration_to_bill ?? 0), 0);
    const value_total = regFacturable.reduce((sum, row) => sum + (row.total_value ?? 0), 0);

    const pdfBuffer = Buffer.from(await createPdf(data, logo, codigoFinal, "reg_facturable", value_total, nombre_caso));
    const pdfBuffer2 = Buffer.from(await createPdf(data, logo, codigoFinal, "", value_total, nombre_caso));

    // Subir el PDF a Supabase Storage
    const bucketName = 'files';
    const filePath = `clientes/${ruc_cliente}/registros_facturables_liquidaciones/${codigoFinal}.pdf`;
    const filePath2 = `clientes/${ruc_cliente}/registros_facturables_liquidaciones/${codigoFinal}-cliente.pdf`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf'
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: uploadClientData, error: uploadClientError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath2, pdfBuffer2, {
        contentType: 'application/pdf'
      });

    if (uploadClientError) {
      throw uploadClientError;
    }

    // Insertar el nuevo registro en reg_facturable_liq
    const { data: newLiqData, error: newLiqError } = await supabase
      .from("reg_facturable_liq")
      .insert([
        {
          client_id: client_id,
          caso_id: caso_id,
          duration_total: duration_total,
          value_total: value_total,
          user_id_liquidator: liquidator_id,
          liq_code: codigoFinal,
          pdf_url: uploadData.fullPath,
          pdf_url_cliente: uploadClientData.fullPath
        }
      ])
      .select()
      .single();

    if (newLiqError) {
      throw newLiqError;
    }

    const newLiqId = newLiqData.id;

    // Actualizar los registros en reg_facturable
    const { error: updateError } = await supabase
      .from("reg_facturable")
      .update({
        is_liquidated: true,
        reg_facturable_liq_id: newLiqId
      })
      .in("id", ids);

    if (updateError) {
      throw updateError;
    }

    // Generar una URL firmada para el archivo PDF
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // URL válida por 3600 segundos

    if (signedUrlError) {
      throw signedUrlError;
    }

    // Responder con la URL firmada
    res.setHeader('Content-Type', 'application/json');
    console.log("OK");
    res.status(201).send({ message: signedUrl.signedUrl });
    /* res.setHeader('Content-Type', 'application/pdf');
    console.log("OK");
    res.status(201).send(pdfBuffer); */
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

app.post('/reportePDF/reportePDFCajaChicaInterna', cors(corsOptions), async (req: express.Request, res: express.Response) => { 
  try {
    let supabase: SupabaseClient;

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

    // Obtener la lista de IDs desde el body de la solicitud
    const { ids, liquidator_id, user_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw "BAD REQUEST: No se proporcionaron IDs válidos";
    }

    if (!liquidator_id) {
      throw "BAD REQUEST: No se proporcionó liquidator_id";
    }

    if (!user_id) {
      throw "BAD REQUEST: No se proporcionó user_id";
    }

    // Obtener el nombre del caso desde client_casos
    const { data: casoData, error: casoError } = await supabase
      .from("client_casos")
      .select("id, case_name");

    if (casoError) {
      throw casoError;
    }

    // Obtener el RUC del cliente desde client
    const { data: clientData, error: clientError } = await supabase
      .from("client")
      .select("id, client_name");

    if (clientError) {
      throw clientError;
    }

    // Obtener la fecha actual en formato "MM-YYYY"
    const fechaActual = DateTime.now().setZone("America/Guayaquil");
    const fechaFormateada = formatDateToMonthYear(fechaActual.toISO());

    // Generar el código base concatenado
    const codigoBase = `CCIL-${fechaFormateada}`;

    // Buscar registros que coincidan con el prefijo en la tabla caja_chica_liq_internal
    const { data: cajaChicaLiqExistentes, error: cajaChicaLiqError } = await supabase
      .from("caja_chica_liq_internal")
      .select("int_liq_code")
      .like("int_liq_code", `${codigoBase}%`);

    if (cajaChicaLiqError) {
      throw cajaChicaLiqError;
    }

    // Determinar el siguiente secuencial
    const secuencial = cajaChicaLiqExistentes.length + 1;
    const secuencialFormateado = String(secuencial).padStart(3, '0');

    // Generar el código final con secuencial
    const codigoFinal = `${codigoBase}-${secuencialFormateado}`;

    // Filtra los datos relevantes de reg_facturable
    const { data: cajaChicaReg, error: cajaChicaRegError } = await supabase
      .from("caja_chica_registros")
      .select("*")
      .filter("internal_liquidation", "eq", false)
      .in("id", ids);

    if (cajaChicaRegError) {
      throw cajaChicaRegError;
    }

    if (!cajaChicaReg || cajaChicaReg.length === 0) {
      throw "NOT FOUND: No se encontraron datos o ya hizo la liquidación interna de alguno de los registros";
    }

    // Obtener los nombres de usuario correspondientes
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, display_name, email")
      .eq("id", user_id)
      .single();

    if (userError) {
      throw userError;
    }

    const { data: cajaChicaDetail, error: cajaChicaDetailError } = await supabase
      .from("caja_chica_reg_detail")
      .select("details, caja_chica_id")
      .in("caja_chica_id", ids);

      if (cajaChicaDetailError) {
        throw cajaChicaDetailError;
      }

    // Crear un mapa de caja_chica_id a una lista de detalles
    const cajaChicaDetailMap = new Map();
    
    // Llenar el mapa con arrays de detalles para cada caja_chica_id
    cajaChicaDetail.forEach(detail => {
      if (!cajaChicaDetailMap.has(detail.caja_chica_id)) {
        cajaChicaDetailMap.set(detail.caja_chica_id, []); // Inicializar array si no existe
      }
      cajaChicaDetailMap.get(detail.caja_chica_id).push(detail.details); // Agregar el detalle al array
    });

    const clientMap = new Map(clientData.map(client => [client.id, client.client_name]));
    const caseMap = new Map(casoData.map(caso => [caso.id, caso.case_name]));

    // Definir el separador para los detalles
    const detalleSeparator = " / ";  // Puedes cambiar este separador según lo que prefieras

    // Construir los datos para el PDF
    const data: RowData[] = cajaChicaReg.map(row => ({
      fecha: formatDate(row.date),
      descripcion: row.concept,
      nombre_usuario: user_id ? user.display_name || "Usuario desconocido" : "Usuario desconocido",
      valor: formatValue(row.value),
      cliente: row.client_id ? clientMap.get(row.client_id) || "Cliente desconocido" : "Cliente desconocido",
      caso: row.caso_id ? caseMap.get(row.caso_id) || "Caso desconocido" : "Caso desconocido",
      // Obtener y unir los detalles correspondientes al caja_chica_id del registro
      detalle: cajaChicaDetailMap.has(row.id)
        ? cajaChicaDetailMap.get(row.id).join(detalleSeparator)
        : "Detalle desconocido"
    }));

    // Constante para almacenar todos los soportes
    const allSoportes: Array<{ tipo: string; soporte: Uint8Array }>  = [];

    for (const row of cajaChicaReg) {
      const { data: soportes, error: soportesError } = await supabase
        .from("caja_chica_soportes")
        .select("file_url, file_type")
        .eq("caja_chica_id", row.id)
        .in("file_type", ["png", "pdf", "jpg", "jpeg", "PNG", "JPG", "JPEG", "PDF"]);

      if (soportesError) {
        throw soportesError;
      }

      for (const soporte of soportes) {
        if (!soporte.file_url || !soporte.file_type) {
          continue;
        }

        const filePath = soporte.file_url.replace('files/', ''); // Eliminar la primera instancia de 'files/'

        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('files')
          .download(filePath);

        if (fileError) {
          throw fileError;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        allSoportes.push({
          tipo: soporte.file_type,
          soporte: new Uint8Array(arrayBuffer)
        });
      }
    }

    // Generar el PDF
    const bucket = 'assets';
    const path = 'landing/under_construction/logo_quezada.png';
    // Obtén la imagen desde Supabase Storage
    const { data: logoData, error: errorLogoData } = await supabase
    .storage
    .from(bucket)
    .download(path);

    if (errorLogoData) {
      throw errorLogoData;
    }

    // Convierte el Blob a ArrayBuffer
    const arrayBuffer = await logoData.arrayBuffer();
    // Convierte el ArrayBuffer en un Uint8Array
    const logo = new Uint8Array(arrayBuffer);

    // Calcular duration_total y value_total
    const value_total = cajaChicaReg.reduce((sum, row) => sum + (row.value ?? 0), 0);

    const pdfBuffer = Buffer.from(await createPdf(data, logo, codigoFinal, "caja_chica_interna", value_total, undefined, allSoportes));

    const { data: cajaChicaSaldos, error: cajaChicaSaldosError} = await supabase
      .from("caja_chica_saldos")
      .select('*')
      .eq("user_id", user_id)
      .single();

    if (cajaChicaLiqError) {
      throw cajaChicaSaldosError;
    }

    // Subir el PDF a Supabase Storage
    const bucketName = 'files';
    const filePath = `users/${user.email}/caja_chica_interna_liquidaciones/${codigoFinal}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf'
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: newLiqData, error: newLiqError } = await supabase
      .from("caja_chica_liq_internal")
      .insert([
        {
          liquidation_value: value_total,
          user_id_liquidator: liquidator_id,
          int_liq_code: codigoFinal,
          user_id: user_id,
          initial_balance: cajaChicaSaldos? cajaChicaSaldos.available_balance : 0,
          final_balance: cajaChicaSaldos? cajaChicaSaldos.available_balance? cajaChicaSaldos.available_balance + value_total : 0 : 0,
          refund: value_total,
          pdf_url: uploadData.fullPath
        }
      ])
      .select()
      .single();

    if (newLiqError) {
      throw newLiqError;
    }

    const newLiqId = newLiqData.id;

    // Actualizar los registros en reg_facturable
    const { error: updateError } = await supabase
      .from("caja_chica_registros")
      .update({
        internal_liquidation: true,
        internal_liquidation_id: newLiqId
      })
      .in("id", ids);

    if (updateError) {
      throw updateError;
    }

    const newAvailableBalance = cajaChicaSaldos?.available_balance 
      ? cajaChicaSaldos.available_balance + value_total 
      : 0;

    const newPendingLiquidation = cajaChicaSaldos?.pending_liquidation 
      ? cajaChicaSaldos.pending_liquidation - value_total 
      : 0;

    const { error: updateCajaChicaSaldosError } = await supabase
      .from("caja_chica_saldos")
      .update({
          pending_liquidation: newPendingLiquidation,
          available_balance: newAvailableBalance,
      })
      .eq("user_id", user_id)
      .single();

    if (updateCajaChicaSaldosError) {
        throw updateCajaChicaSaldosError;
    }

    // Generar una URL firmada para el archivo PDF
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // URL válida por 3600 segundos

    if (signedUrlError) {
      throw signedUrlError;
    }

    // Responder con la URL firmada
    res.setHeader('Content-Type', 'application/json');
    console.log("OK");
    res.status(201).send({ message: signedUrl.signedUrl });

    /* res.setHeader('Content-Type', 'application/pdf');
    console.log("OK");
    res.status(201).send(pdfBuffer); */
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

app.post('/reportePDF/reportePDFCajaChicaCliente', cors(corsOptions), async (req: express.Request, res: express.Response) => { 
  try {
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

    // Obtener la lista de IDs desde el body de la solicitud
    const { ids, liquidator_id, caso_id, client_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw "BAD REQUEST: No se proporcionaron IDs válidos";
    }

    if (!caso_id) {
      throw "BAD REQUEST: No se proporcionó caso_id";
    }

    if (!client_id) {
      throw "BAD REQUEST: No se proporcionó client_id";
    }

    if (!liquidator_id) {
      throw "BAD REQUEST: No se proporcionó liquidator_id";
    }

    // Obtener el nombre del caso desde client_casos
    const { data: casoData, error: casoError } = await supabase
      .from("client_casos")
      .select("case_name")
      .eq("id", caso_id)
      .single();

    if (casoError) {
      throw casoError;
    }

    const nombre_caso = casoData.case_name || "Caso desconocido";

    // Obtener el RUC del cliente desde client
    const { data: clientData, error: clientError } = await supabase
      .from("client")
      .select("id_number")
      .eq("id", client_id)
      .single();

    if (clientError) {
      throw clientError;
    }

    const ruc_cliente = clientData.id_number || "RUC desconocido";

    // Obtener la fecha actual en formato "MM-YYYY"
    const fechaActual = DateTime.now().setZone("America/Guayaquil");
    const fechaFormateada = formatDateToMonthYear(fechaActual.toISO());

    // Generar el código base concatenado
    const codigoBase = `CCCL-${ruc_cliente}-${fechaFormateada}`;

    // Buscar registros que coincidan con el prefijo en la tabla caja_chica_liq_internal
    const { data: cajaChicaLiqExistentes, error: cajaChicaLiqError } = await supabase
      .from("caja_chica_liq_client")
      .select("client_liq_code")
      .like("client_liq_code", `${codigoBase}%`);

    if (cajaChicaLiqError) {
      throw cajaChicaLiqError;
    }

    // Determinar el siguiente secuencial
    const secuencial = cajaChicaLiqExistentes.length + 1;
    const secuencialFormateado = String(secuencial).padStart(3, '0');

    // Generar el código final con secuencial
    const codigoFinal = `${codigoBase}-${secuencialFormateado}`;

    // Filtra los datos relevantes de reg_facturable
    const { data: cajaChicaReg, error: cajaChicaRegError } = await supabase
      .from("caja_chica_registros")
      .select("*")
      .filter("internal_liquidation", "eq", true)
      .filter("client_liquidation", "eq", false)
      .in("id", ids);


    if (cajaChicaRegError) {
      throw cajaChicaRegError;
    }

    if (!cajaChicaReg || cajaChicaReg.length === 0) {
      throw "NOT FOUND: No se encontraron datos o aún no ha hecho la liquidación interna de alguno de los registros";
    }

    // Obtener los nombres de usuario correspondientes
    const userIds = cajaChicaReg.map(row => row.register_by_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", userIds);

    if (usersError) {
      throw usersError;
    }

    const { data: cajaChicaDetail, error: cajaChicaDetailError } = await supabase
      .from("caja_chica_reg_detail")
      .select("details")
      .in("caja_chica_id", ids);

      if (cajaChicaDetailError) {
        throw cajaChicaDetailError;
      }

    const userMap = new Map(users.map(user => [user.id, user.display_name]));
    const cajaChicaDetailFormatted = cajaChicaDetail
    .map(detail => detail.details)
    .join('/');

    // Construir los datos para el PDF
    const data: RowData[] = cajaChicaReg.map(row => ({
      fecha: formatDate(row.date),
      descripcion: row.concept,
      nombre_usuario: row.register_by_id ? userMap.get(row.register_by_id) || "Usuario desconocido" : "Usuario desconocido",
      valor: formatValue(row.value),
      detalle: cajaChicaDetailFormatted
    }));

    // Constante para almacenar todos los soportes
    const allSoportes: Array<{ tipo: string; soporte: Uint8Array }>  = [];

    for (const row of cajaChicaReg) {
      const { data: soportes, error: soportesError } = await supabase
        .from("caja_chica_soportes")
        .select("file_url, file_type")
        .eq("caja_chica_id", row.id)
        .in("file_type", ["png", "pdf", "jpg", "jpeg", "PNG", "JPG", "JPEG", "PDF"]);

      if (soportesError) {
        throw soportesError;
      }

      for (const soporte of soportes) {
        if (!soporte.file_url || !soporte.file_type) {
          continue;
        }

        const filePath = soporte.file_url.replace('files/', ''); // Eliminar la primera instancia de 'files/'

        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('files')
          .download(filePath);

        if (fileError) {
          throw fileError;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        allSoportes.push({
          tipo: soporte.file_type,
          soporte: new Uint8Array(arrayBuffer)
        });
      }
    }

    // Generar el PDF
    const bucket = 'assets';
    const path = 'landing/under_construction/logo_quezada.png';
    // Obtén la imagen desde Supabase Storage
    const { data: logoData, error: errorLogoData } = await supabase
    .storage
    .from(bucket)
    .download(path);

    if (errorLogoData) {
      throw errorLogoData;
    }

    // Convierte el Blob a ArrayBuffer
    const arrayBuffer = await logoData.arrayBuffer();
    // Convierte el ArrayBuffer en un Uint8Array
    const logo = new Uint8Array(arrayBuffer);

    // Calcular duration_total y value_total
    const value_total = cajaChicaReg.reduce((sum, row) => sum + (row.value ?? 0), 0);

    const pdfBuffer = Buffer.from(await createPdf(data, logo, codigoFinal, "caja_chica_cliente", value_total, nombre_caso, allSoportes));

    // Subir el PDF a Supabase Storage
    const bucketName = 'files';
    const filePath = `clientes/${ruc_cliente}/caja_chica_cliente_liquidaciones/${codigoFinal}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf'
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: newLiqData, error: newLiqError } = await supabase
      .from("caja_chica_liq_client")
      .insert([
        {
          caso_id: caso_id,
          client_id: client_id,
          client_liq_code: codigoFinal,
          user_id_liquidator: liquidator_id,
          value: value_total,
          pdf_url: uploadData.fullPath,
        }
      ])
      .select()
      .single();

    if (newLiqError) {
      throw newLiqError;
    }

    const newLiqId = newLiqData.id;

    // Actualizar los registros en reg_facturable
    const { error: updateError } = await supabase
      .from("caja_chica_registros")
      .update({
        client_liquidation: true,
        client_liquidation_id: newLiqId
      })
      .in("id", ids);

    if (updateError) {
      throw updateError;
    }

    // Generar una URL firmada para el archivo PDF
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // URL válida por 3600 segundos

    if (signedUrlError) {
      throw signedUrlError;
    }

    // Responder con la URL firmada
    res.setHeader('Content-Type', 'application/json');
    console.log("OK");
    res.status(201).send({ message: signedUrl.signedUrl });
    /* res.setHeader('Content-Type', 'application/pdf');
    console.log("OK");
    res.status(201).send(pdfBuffer); */
  } catch (error) {
    const errorJSON = JSON.stringify(error);
    if (typeof error === "string") {
      if (error.startsWith("BAD REQUEST")) {
        res.status(400).json({ message: `Ocurrió el siguiente error de solicitud incorrecta: ${errorJSON}` });
      } else if (error.startsWith("UNAUTHORIZED")) {
        res.status(401).json({ message: `Ocurrió el siguiente error de autorización: ${errorJSON}` });
      } else if (error.startsWith("FORBIDDEN")) {
        res.status(403).json({ message: `Ocurrió el siguiente error de prohibición: ${errorJSON}` });
      } else if (error.startsWith("NOT FOUND")) {
        res.status(404).json({ message: `Ocurrió el siguiente error de localización: ${errorJSON}` });
      } else if (error.startsWith("CONFLICT")) {
        res.status(409).json({ message: `Ocurrió el siguiente error de conflictos: ${errorJSON}` });
      } else {
        res.status(500).json({ message: `Ocurrió el siguiente error: ${errorJSON}` });
      }
    } else {
      res.status(500).json({ message: `Ocurrió el siguiente error: ${errorJSON}` });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

// Definimos el tipo RowData para asegurarnos de que las propiedades existen
type RowData = {
  fecha: string | null;
  descripcion: string | null;
  nombre_usuario: string | null;
  duracion?: string | null;
  valor: string | null;
  cliente?: string | null;
  caso?: string | null;
  inicio?: string | null;
  final?: string | null;
  horasTrabajadas?: string | null;
  horasFacturables?: string | null;
  tarifaHora?: string | null;
  detalle?: string | null;
};

async function createPdf(data: RowData[], logoBytes: Uint8Array, codigo: string, tipoLiq: string, valor_total: number, nombre_caso?: string, soportes?: Array<{ tipo: string; soporte: Uint8Array }>) {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // Fuente en negritas

  // Incrustar la imagen del logo
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scale(0.15); // Escalar la imagen si es necesario

  let page: PDFPage;
  if(tipoLiq == "reg_facturable" || tipoLiq == "caja_chica_interna") {
    page = pdfDoc.addPage([1028, 650]);
  } else {
    page = pdfDoc.addPage(PageSizes.Letter);
  }
  const { width, height } = page.getSize();
  const fontSize = 10;
  const footerFontSize = 8;
  const footerMargin = 10; // Margen adicional entre el contenido y el pie de página

  // Dibujar el logo en la esquina superior izquierda
  page.drawImage(logoImage, {
    x: 35,
    y: height - logoDims.height - 20, // Ajustar la posición vertical según el tamaño de la imagen
    width: logoDims.width,
    height: logoDims.height,
  });

  // Título: "LIQUIDACIÓN DE HORAS FACTURABLES"
  page.drawText('LIQUIDACIÓN DE HORAS FACTURABLES', {
    x: 35,
    y: height - 130, // Ajuste vertical para estar alineado con la parte superior del logo
    size: fontSize,
    font: helveticaFont,
    color: rgb(0.737, 0.549, 0.361),
  });

  // Información general: "CÓDIGO: ABC123" y "PROCESO: NOMBRE DEL PROCESO"
  page.drawText('CÓDIGO:', {
    x: 35,
    y: height - 160,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0.737, 0.549, 0.361),
  });

  page.drawText(codigo, {
    x: 35, // Debajo de "CÓDIGO:", alinear a la derecha con un espacio considerable
    y: height - 180,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  if (nombre_caso) {
    page.drawText('CASO:', {
      x: 235, // Espacio considerable a la derecha de "CÓDIGO:"
      y: height - 160,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.737, 0.549, 0.361),
    });
  
    page.drawText(nombre_caso, {
      x: 235, // Debajo de "CASO:", alinear a la derecha con un espacio considerable
      y: height - 180,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  }

  page.drawText('VALOR TOTAL DE LIQUIDACIÓN:', {
    x: 35,
    y: height - 200,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0.737, 0.549, 0.361),
  });

  page.drawText(`$${valor_total.toFixed(2)}`, {
    x: 35,
    y: height - 220,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  // Tabla de datos
  const tableTop = height - 240;
  const tableLeft = 35;
  const rowHeight = 20;
  let yPosition = tableTop;

  let headers: { label: string, key: keyof RowData }[];
  let columnWidths: number[];

  if (tipoLiq == "caja_chica_interna") {
    headers = [
      { label: 'Fecha', key: 'fecha' },
      { label: 'Descripción', key: 'descripcion' },
      { label: 'Detalles', key: 'detalle' },
      { label: 'Usuario', key: 'nombre_usuario' },
      { label: 'Valor', key: 'valor' },
      { label: 'Cliente', key: 'cliente' },
      { label: 'Caso', key: 'caso' },
    ];
    columnWidths = [90, 140, 260, 120, 90, 120, 120]; // Anchos de columna
  } else if (tipoLiq == "caja_chica_cliente") {
    headers = [
      { label: 'Fecha', key: 'fecha' },
      { label: 'Descripción', key: 'descripcion' },
      { label: 'Detalles', key: 'detalle' },
      { label: 'Usuario', key: 'nombre_usuario' },
      { label: 'Valor', key: 'valor' },
    ];
    columnWidths = [80, 100, 150, 120, 90]; // Anchos de columna
  } else if (tipoLiq == "reg_facturable") {
    headers = [
      { label: 'Fecha', key: 'fecha' },
      { label: 'Descripción', key: 'descripcion' },
      { label: 'Usuario', key: 'nombre_usuario' },
      { label: 'Hora de inicio', key: 'inicio' },
      { label: 'Hora de termino', key: 'final' },
      { label: 'Horas trabajadas', key: 'horasTrabajadas' },
      { label: 'Horas facturables', key: 'horasFacturables' },
      { label: 'Tarifa por hora', key: 'tarifaHora' },
      { label: 'Valor trabajo', key: 'valor' },
    ];
    columnWidths = [65, 140, 140, 90, 90, 90, 90, 90, 90];
  } else {
    headers = [
      { label: 'Fecha', key: 'fecha' },
      { label: 'Descripción', key: 'descripcion' },
      { label: 'Nombre', key: 'nombre_usuario' },
      { label: 'Duración', key: 'horasFacturables'},
      { label: 'Valor', key: 'valor' },
    ];
    columnWidths = [100, 140, 100, 100, 90]; // Anchos de columna
  }

  headers.forEach((header, i) => {
    const xPosition = tableLeft + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
    
    // Dibujar rectángulo de la celda del encabezado
    page.drawRectangle({
      x: xPosition,
      y: yPosition - rowHeight,
      width: columnWidths[i],
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Dibujar el texto del encabezado
    page.drawText(header.label, {
      x: xPosition + 5, // Padding para el texto
      y: yPosition - fontSize - 2, // Ajuste adicional para evitar superposición
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  });

  // Ajustar yPosition para empezar con las filas de datos
  yPosition -= rowHeight;

  // Dibujar filas de datos y bordes
  data.forEach((row: RowData, index) => {
    let maxLines = 1; // Para almacenar la cantidad máxima de líneas en una fila

    // Calcular el máximo de líneas para cualquier columna en la fila actual
    headers.forEach((header, i) => {
      const cellText = row[header.key] || '';
      const lines = splitTextIntoLines(cellText.toString(), columnWidths[i] - 10, fontSize, helveticaFont);
      maxLines = Math.max(maxLines, lines.length);
    });

    // Verificar si es la última página y si el pie de página adicional se superpondrá
    const spaceForFooter = footerMargin + 85 + footerFontSize * 4; // Espacio para el pie de página adicional, común y margen
    if (index === data.length - 1 && yPosition - maxLines * rowHeight < spaceForFooter) {
      if(tipoLiq == "reg_facturable" || tipoLiq == "caja_chica_interna") {
        page = pdfDoc.addPage([1028, 612]);
      } else {
        page = pdfDoc.addPage(PageSizes.Letter);
      }
      yPosition = height - 50; // Reiniciar yPosition para la nueva página
    } else if (yPosition - maxLines * rowHeight < 60 + footerMargin) {
      // Crear una nueva página si no es la última página y no hay suficiente espacio para el margen y pie de página
      if(tipoLiq == "reg_facturable" || tipoLiq == "caja_chica_interna") {
        page = pdfDoc.addPage([1028, 612]);
      } else {
        page = pdfDoc.addPage(PageSizes.Letter);
      }
      yPosition = height - 50; // Reiniciar yPosition para la nueva página
    }

    // Dibujar el contenido y los bordes de cada celda, basándose en el máximo de líneas
    headers.forEach((header, i) => {
      const xPosition = tableLeft + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      const cellHeight = maxLines * rowHeight;

      // Dibujar el rectángulo de la celda
      page.drawRectangle({
        x: xPosition,
        y: yPosition - cellHeight,
        width: columnWidths[i],
        height: cellHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Obtener el valor de la celda correspondiente usando la clave correcta
      const cellText = row[header.key] || '';
      const lines = splitTextIntoLines(cellText.toString(), columnWidths[i] - 10, fontSize, helveticaFont);

      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: xPosition + 5,
          y: yPosition - (lineIndex * rowHeight) - 15, // Ajuste adicional para bajar el texto
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });
    });

    // Ajustar yPosition para la siguiente fila
    yPosition -= (maxLines * rowHeight);
  });
  
  pdfDoc.getPages().forEach((p, index) => {
    if (index === pdfDoc.getPageCount() - 1) {
      // Pie de página adicional en la última página, no centrado
      const additionalFooterText = `Ab. Franklin Quezada Castillo\nC.C. No. 0924112675`;
      const additionalFooterLines = additionalFooterText.trim().split('\n');
      let additionalFooterYPosition = 85; // Posición en la última página

      additionalFooterLines.forEach((line) => {
        p.drawText(line.trim(), {
          x: 35, // No centrado, alineado a la izquierda
          y: additionalFooterYPosition,
          size: footerFontSize + 2,
          font: helveticaBoldFont, // Utilizar la fuente en negritas,
          color: rgb(0, 0, 0),
        });
        additionalFooterYPosition -= footerFontSize + 2; // Espaciado entre líneas
      });

      drawFooter(p, helveticaFont, footerFontSize, width); // Dibujar el pie de página común después del adicional
    } else {
      drawFooter(p, helveticaFont, footerFontSize, width); // Dibujar solo el pie de página común
    }
  });

  if (soportes) {
    let count: number = 0;
    while (soportes.length > count) {
      page = pdfDoc.addPage(PageSizes.Letter);
      if (soportes[count].tipo.toLowerCase() === 'pdf') {
        const [pdffile] = await pdfDoc.embedPdf(soportes[count].soporte);
        page.drawPage(pdffile, {
          width: page.getWidth() / 1.1,
        });
      } else if (soportes[count].tipo.toLowerCase() === 'png') {
        const pngImage = await pdfDoc.embedPng(soportes[count].soporte);
        const pngDims = pngImage.scale(0.3);
        page.drawImage(pngImage, {
          x: page.getWidth() / 2 - pngDims.width / 2,
          y: page.getHeight() / 2 - pngDims.height + 250,
          width: pngDims.width,
          height: pngDims.height * 1.2,
        });
      } else {
        const jpgImage = await pdfDoc.embedJpg(soportes[count].soporte);
        const jpgDims = jpgImage.scale(0.3);
        page.drawImage(jpgImage, {
          x: page.getWidth() / 2 - jpgDims.width / 2,
          y: page.getHeight() / 2 - jpgDims.height + 250,
          width: jpgDims.width,
          height: jpgDims.height * 1.2,
        });
      }
      count++;
    }
  }

  return await pdfDoc.save();
}

// Función para formatear la fecha a "DD-MM-YYYY"
function formatDate(timestamp: string | null): string | null {
  if (timestamp === null) {
    return null;
  }
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Función para formatear la fecha a "h:mm"
function formatHour(timestamp: string | null): string | null {
  if (timestamp === null) {
    return null;
  }
  const date = new Date(timestamp);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

// Función para formatear la duración en "X horas X minutos"
function formatDuration(duration: number | null): string | null {
  if (duration === null) {
    return null;
  }
  const hours = Math.floor(duration);
  const minutes = Math.round((duration - hours) * 60);
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  return `${formattedHours}:${formattedMinutes}`;
}

// Función para formatear el valor a "$X.XX"
function formatValue(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return `$${value.toFixed(2)}`;
}

// Función para formatear la fecha a "MM-YYYY"
function formatDateToMonthYear(timestamp: string | null): string | null {
  if (timestamp === null) {
    return null;
  }
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
  const year = date.getFullYear();
  return `${month}-${year}`;
}

// Función para dividir el texto en varias líneas si es necesario
function splitTextIntoLines(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Pie de página común en todas las páginas, centrado
function drawFooter(currentPage: PDFPage, font: PDFFont, footerSize: number, width: number) {
  const footerText = `
    Dirección: Centro Comercial Plaza Lagos, Km. 6.5 vía Samborondón, Edificio Mirador Este, piso 1 oficina 1.8
    Teléfonos: 045101683 – 045101460 – 045101398 
    e-mail: info@estudioquezada.com.ec 
    Samborondón – Ecuador`;

  const footerLines = footerText.trim().split('\n');
  let footerYPosition = 50;

  footerLines.forEach((line) => {
    const textWidth = font.widthOfTextAtSize(line.trim(), footerSize);
    const xPosition = (width - textWidth) / 2; // Cálculo para centrar el texto
    currentPage.drawText(line.trim(), {
      x: xPosition,
      y: footerYPosition,
      size: footerSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    footerYPosition -= footerSize + 2; // Espaciado entre líneas
  });
}
