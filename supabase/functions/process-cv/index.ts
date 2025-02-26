
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ImageAnnotatorClient } from "@google-cloud/vision"

serve(async (req) => {
  // Obtener el origen de la solicitud
  const origin = req.headers.get("origin") || "";
  
  // Configurar CORS específico para nuestro dominio
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    console.log(`📄 Processing file: ${file.name}`);

    const credentials = JSON.parse(Deno.env.get('GOOGLE_CLOUD_CREDENTIALS') || '{}');
    const visionClient = new ImageAnnotatorClient({ credentials });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log('🔍 Iniciando detección de texto con Vision API...');

    const [result] = await visionClient.textDetection(buffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      throw new Error('No text detected in document');
    }

    const extractedText = detections[0].description || '';
    console.log('✅ Texto extraído exitosamente');

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while processing the file' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
