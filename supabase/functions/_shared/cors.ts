// Define los dominios permitidos como expresiones regulares
const allowedOrigins = [/aion-juridico-quezada\.flutterflow\.app$/, /app\.flutterflow\.io\/debug$/];

// Tipo de índice para los headers CORS
type CorsHeaders = {
    [key: string]: string;
};

// Función para obtener los headers CORS dinámicamente
export function getCorsHeaders(origin: string): CorsHeaders {
    // Verifica si el origen de la solicitud coincide con alguno de los patrones permitidos
    const isAllowed = allowedOrigins.some((pattern) => pattern.test(origin));

    // Configura los headers CORS
    const corsHeaders: CorsHeaders = {
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    if (isAllowed) {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
    }

    return corsHeaders;
}
