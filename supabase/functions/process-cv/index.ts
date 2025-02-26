
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ImageAnnotatorClient } from "@google-cloud/vision"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar que sea una solicitud POST
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Obtener el archivo del FormData
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided')
    }

    console.log(`📄 Processing file: ${file.name}`)

    // Crear cliente de Vision API con credenciales
    const credentials = JSON.parse(Deno.env.get('GOOGLE_CLOUD_CREDENTIALS') || '{}')
    const visionClient = new ImageAnnotatorClient({ credentials })

    // Convertir el archivo a un buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    console.log('🔍 Iniciando detección de texto con Vision API...')

    // Detectar texto en la imagen
    const [result] = await visionClient.textDetection(buffer)
    const detections = result.textAnnotations

    if (!detections || detections.length === 0) {
      console.log('❌ No se detectó texto en el documento')
      throw new Error('No text detected in document')
    }

    // El primer elemento contiene todo el texto detectado
    const extractedText = detections[0].description || ''
    console.log('✅ Texto extraído exitosamente')

    return new Response(
      JSON.stringify({ text: extractedText }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while processing the file' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})
