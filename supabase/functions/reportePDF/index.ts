// @deno-types="npm:@types/morgan";
import morgan from "npm:morgan@1.10.0";

// @deno-types="npm:@types/express";
import express from "npm:express@4.18.3";

import { config } from "npm:dotenv@16.4.5";
import process from "node:process";
import { Buffer } from "node:buffer";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.1"
import { Database } from "../database.types.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import cors from "npm:cors";
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage, PDFFont } from "npm:pdf-lib@1.17.1";

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

app.post('/reportePDF', async (req: express.Request, res: express.Response) => { 
  try {
    let supabase;

    if (Deno.env.get("SB_KEY") === Deno.env.get("SUPABASE_ANON_KEY")) {
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
        }
      })
    }

    // Obtener la lista de IDs desde el body de la solicitud
    const { ids, client_id, caso_id, liquidator_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw "BAD REQUEST: No se proporcionaron IDs válidos";
    }

    if (!client_id || !caso_id) {
      throw "BAD REQUEST: No se proporcionaron client_id o caso_id";
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
    const fechaActual = new Date();
    const fechaFormateada = formatDateToMonthYear(fechaActual.toISOString());

    // Generar el código base concatenado
    const codigoBase = `${ruc_cliente}-${fechaFormateada}`;

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
      fecha: formatDate(row.start_date_time),
      descripcion: row.details,
      nombre_usuario: row.register_by_id ? userMap.get(row.register_by_id) || "Usuario desconocido" : "Usuario desconocido",
      duracion: formatDuration(row.duration_to_bill),
      valor: formatValue(row.total_value),
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

    const pdfBuffer = Buffer.from(await createPdf(data, logo, nombre_caso, codigoFinal));

    // Calcular duration_total y value_total
    const duration_total = regFacturable.reduce((sum, row) => sum + (row.duration_to_bill ?? 0), 0);
    const value_total = regFacturable.reduce((sum, row) => sum + (row.total_value ?? 0), 0);

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
          liq_code: codigoFinal
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

    // Responder con el PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=liquidacion.pdf');
    console.log("OK");
    res.status(201).send(pdfBuffer);
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
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

// Definimos el tipo RowData para asegurarnos de que las propiedades existen
type RowData = {
  fecha: string | null;
  descripcion: string | null;
  nombre_usuario: string | null;
  duracion: string | null;
  valor: string | null;
};

async function createPdf(data: RowData[], logoBytes: Uint8Array, nombre_caso: string, codigo: string) {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // Fuente en negritas

  // Incrustar la imagen del logo
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scale(0.15); // Escalar la imagen si es necesario

  let page = pdfDoc.addPage(PageSizes.Letter);
  const { width, height } = page.getSize();
  const fontSize = 12;
  const footerFontSize = 10;
  const footerMargin = 10; // Margen adicional entre el contenido y el pie de página

  // Dibujar el logo en la esquina superior izquierda
  page.drawImage(logoImage, {
    x: 35,
    y: height - logoDims.height - 20, // Ajustar la posición vertical según el tamaño de la imagen
    width: logoDims.width,
    height: logoDims.height,
  });

  // Título: "LIQUIDACIÓN DE HONORARIOS PROFESIONALES"
  page.drawText('LIQUIDACIÓN DE HONORARIOS PROFESIONALES', {
    x: 35, // Justo a la derecha del logo, con un espacio adicional
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

  // Tabla de datos
  const tableTop = height - 210;
  const tableLeft = 35;
  const rowHeight = 20;
  let yPosition = tableTop;

  const headers: { label: string, key: keyof RowData }[] = [
    { label: 'Fecha', key: 'fecha' },
    { label: 'Descripción', key: 'descripcion' },
    { label: 'Nombre Usuario', key: 'nombre_usuario' },
    { label: 'Duración', key: 'duracion' },
    { label: 'Valor', key: 'valor' },
  ];

  const columnWidths = [80, 150, 150, 80, 80]; // Anchos de columna

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
      page = pdfDoc.addPage(PageSizes.Letter);
      yPosition = height - 50; // Reiniciar yPosition para la nueva página
    } else if (yPosition - maxLines * rowHeight < 60 + footerMargin) {
      // Crear una nueva página si no es la última página y no hay suficiente espacio para el margen y pie de página
      page = pdfDoc.addPage(PageSizes.Letter);
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
  return `${day}-${month}-${year}`;
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