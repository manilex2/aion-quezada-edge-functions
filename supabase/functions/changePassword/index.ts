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
  if (!req.body.password) {
    res.status(400).send(JSON.stringify({ response: { status: 400, message: `Ocurrió el siguiente error: No se proporcionó una contraseña` }}));
  } else if(!req.body.email) {
    res.status(400).send(JSON.stringify({ response: { status: 400, message: `Ocurrió el siguiente error: No se proporcionó un email` }}));
  }
  try {
    const body = req.body;
    console.log(body);
    const supabase = createClient<Database>(Deno.env.get("SB_URL")!, Deno.env.get("SB_KEY")!);

    const { error: errorLogged } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.old_password,
    });
    if (errorLogged) {
      res.status(401).send(JSON.stringify({ response: { status: 401, message: `Ocurrió el siguiente error: La contraseña anterior o email no es correcto` }}));
    }

    const { error: userRegisterError } = await supabase.from("users").select().eq('email', body.email).limit(1).single();
    if (userRegisterError) {
      console.error(userRegisterError);
      throw "El usuario no se encuentra registrado";
    }

    const { error: userError } = await supabase.auth.updateUser({
      password: body.password,
    });
    if (userError) {
      console.error(userError);
      throw userError;
    }
    console.log("OK");
    res.status(200).send(JSON.stringify({ response: { status: 200, message: "Contraseña cambiada correctamente." }}));
  } catch (error) {
    res.status(403).send(JSON.stringify({ response: { status: 403, message: `Ocurrió el siguiente error: ${error}` }}));
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});