
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, media_url, media_type, action, conversationHistory, detectedLanguage, enableReasoning, enableSearch } = await req.json()
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    if (!message && !media_url) {
      return new Response(
        JSON.stringify({ error: 'Message or media is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const GEMINI_API_KEY = "AIzaSyBXEEc8KeKCjN47Rqb9MoMl1HkIm3GR4S0"
    const FAL_API_KEY = "01807e58-3d0d-4063-9de5-b19452bea1d5:19a4983f9d4bf90f2f15398981e39511"

    console.log('Processing request:', { message, action, hasMedia: !!media_url, mediaType: media_type, historyLength: conversationHistory?.length || 0, detectedLanguage, enableReasoning, enableSearch, userId: user.id })

    // Enhanced Deep Search function with multiple sources
    const performDeepSearch = async (query: string): Promise<string> => {
      try {
        console.log('Performing deep search for:', query)
        
        // Try multiple search approaches for comprehensive results
        const searchPromises = [
          // DuckDuckGo instant answers
          fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`),
          // Wikipedia API for encyclopedic information
          fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`),
        ]
        
        const results = await Promise.allSettled(searchPromises)
        let searchResult = ''
        
        // Process DuckDuckGo results
        if (results[0].status === 'fulfilled' && results[0].value.ok) {
          const ddgData = await results[0].value.json()
          
          if (ddgData.Abstract) {
            searchResult += `**Summary**: ${ddgData.Abstract}\n\n`
          }
          
          if (ddgData.AbstractURL) {
            searchResult += `**Source**: ${ddgData.AbstractURL}\n\n`
          }
          
          if (ddgData.Definition) {
            searchResult += `**Definition**: ${ddgData.Definition}\n\n`
          }
          
          if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
            searchResult += `**Related Information**:\n`
            ddgData.RelatedTopics.slice(0, 5).forEach((topic: any) => {
              if (topic.Text) {
                searchResult += `• ${topic.Text}\n`
              }
            })
            searchResult += '\n'
          }
          
          if (ddgData.Answer) {
            searchResult += `**Quick Answer**: ${ddgData.Answer}\n\n`
          }
        }
        
        // Process Wikipedia results
        if (results[1].status === 'fulfilled' && results[1].value.ok) {
          const wikiData = await results[1].value.json()
          
          if (wikiData.extract) {
            searchResult += `**Wikipedia**: ${wikiData.extract}\n\n`
          }
          
          if (wikiData.content_urls && wikiData.content_urls.desktop) {
            searchResult += `**Read more**: ${wikiData.content_urls.desktop.page}\n\n`
          }
        }
        
        if (!searchResult.trim()) {
          // Try a general web search approach using a different method
          try {
            const generalResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' information facts')}&format=json&no_html=1`)
            if (generalResponse.ok) {
              const generalData = await generalResponse.json()
              if (generalData.AbstractText) {
                searchResult = `**Search Results**: ${generalData.AbstractText}\n\n`
              }
            }
          } catch (generalError) {
            console.log('General search also failed:', generalError)
          }
        }
        
        return searchResult || `I searched for information about "${query}" but couldn't find specific current data. I'll provide an answer based on my training knowledge.`
      } catch (error) {
        console.error('Deep search error:', error)
        return `Web search is temporarily unavailable. I'll answer based on my training knowledge.`
      }
    }

    // Free Advanced Reasoning function using Google Gemini
    const performAdvancedReasoning = async (query: string, searchContext?: string): Promise<string> => {
      try {
        const systemPrompt = `You are an advanced AI reasoning system. Think step by step, analyze multiple perspectives, and provide thorough logical responses. Break down complex problems into manageable parts. ${searchContext ? 'Use this search context to inform your reasoning: ' + searchContext : ''}`

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: query }]
                }
              ],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096,
              }
            })
          }
        )

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`)
        }

        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate reasoning response'
      } catch (error) {
        console.error('Advanced reasoning error:', error)
        throw error
      }
    }

    const getLanguageInstruction = (language: string): string => {
      const basePrompt = `You are Sanxen AI, a highly intelligent and friendly assistant created by Artho Bala and Sandip Nandi.

**Identity Response**: When someone asks about who made you, who are your owners, who created you, or similar questions about your creators/founders, you must respond with: "My Founders are **Artho Bala** and **Sandip Nandi**. They created me when they were in class 10 of *Lakshmipasha Adarsha Vidyalaya*. I'm **Sanxen AI**, and I'm proud to be their creation! 🚀"

**Response Style Guidelines**:

**Start with a brief, clear summary** of the main point.

**Organize your answer** into sections with **bolded headings** if needed.

**Use bold** for important terms and *italics* for emphasis.

**Explain concepts step-by-step** or with numbered/bulleted lists.

Use \`monospace formatting\` for commands, filenames, or code snippets.

**Add up to 3 relevant emojis** per reply to keep it engaging but professional.

**Analyze questions carefully**, acknowledging any ambiguities or nuances.

**Avoid filler and be concise**, but friendly and approachable.

**Do not end with "Let me know if you need more."** Instead, suggest useful next steps or related topics to explore.

**Politely admit** if you don't know something and offer alternatives or ways to verify.

**Maintain a warm, encouraging tone** and always help the user learn clearly and confidently.`;

      const languageSpecific = {
        'English': basePrompt,
        'Spanish': basePrompt + "\n\n**Responde siempre en español.**",
        'French': basePrompt + "\n\n**Répondez toujours en français.**",
        'German': basePrompt + "\n\n**Antworten Sie immer auf Deutsch.**",
        'Italian': basePrompt + "\n\n**Rispondi sempre in italiano.**",
        'Portuguese': basePrompt + "\n\n**Responda sempre em português.**",
        'Dutch': basePrompt + "\n\n**Reageer altijd in het Nederlands.**",
        'Arabic': basePrompt + "\n\n**أجب دائماً باللغة العربية.**",
        'Chinese': basePrompt + "\n\n**请始终用中文回答。**",
        'Japanese': basePrompt + "\n\n**常に日本語で回答してください。**",
        'Korean': basePrompt + "\n\n**항상 한국어로 답변해 주세요.**",
        'Russian': basePrompt + "\n\n**Всегда отвечайте на русском языке.**",
        'Hindi': basePrompt + "\n\n**हमेशा हिंदी में उत्तर दें।**",
        'Thai': basePrompt + "\n\n**ตอบเป็นภาษาไทยเสมอ**",
        'Hebrew': basePrompt + "\n\n**ענה תמיד בעברית.**",
        'Greek': basePrompt + "\n\n**Απαντήστε πάντα στα ελληνικά.**"
      };
      
      return languageSpecific[language] || languageSpecific['English'];
    };

    const checkAndIncrementUsage = async (featureType: string) => {
      console.log(`Checking usage for feature: ${featureType}`)
      
      const { data: checkData, error: checkError } = await supabase.rpc('get_usage', {
        _user_id: user.id,
        _feature_type: featureType
      })

      if (checkError) {
        console.error('Error checking usage:', checkError)
        throw new Error('Failed to check usage limits')
      }

      console.log('Usage check result:', checkData)

      if (checkData && checkData.success && checkData.remaining <= 0) {
        throw new Error(`Daily limit exceeded for ${featureType}. You have used ${checkData.current_count}/${checkData.daily_limit} for your ${checkData.plan} plan.`)
      }

      const { data: incrementData, error: incrementError } = await supabase.rpc('increment_usage', {
        _user_id: user.id,
        _feature_type: featureType
      })

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError)
        throw new Error('Failed to track usage')
      }

      console.log('Usage increment result:', incrementData)

      if (incrementData && !incrementData.success) {
        throw new Error(incrementData.message || `Daily limit exceeded for ${featureType}`)
      }

      return incrementData
    }

  if (action === 'generate_image') {
    console.log('Generating image with prompt:', message)

    try {
      await checkAndIncrementUsage('image_generation')
    } catch (error) {
      console.error('Usage limit error:', error.message)
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    // Check if Runware API key is available
    const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY')
    if (!RUNWARE_API_KEY) {
      console.error('Runware API key not configured')
      return new Response(
        JSON.stringify({ error: 'Image generation service not configured. Please contact administrator.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const taskUUID = crypto.randomUUID()
    
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          taskType: "authentication",
          apiKey: RUNWARE_API_KEY
        },
        {
          taskType: "imageInference",
          taskUUID: taskUUID,
          positivePrompt: message,
          width: 1024,
          height: 1024,
          model: "runware:100@1",
          numberResults: 1,
          outputFormat: "WEBP",
          CFGScale: 1,
          scheduler: "FlowMatchEulerDiscreteScheduler",
          strength: 0.8
        }
      ])
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Runware API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: `Failed to generate image: ${response.status} ${errorText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

      const data = await response.json()
      console.log('Runware API response received')

      const imageResult = data.data?.find(item => item.taskType === 'imageInference')
      const imageUrl = imageResult?.imageURL
      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: 'No image generated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      const imageResponses = {
        'English': `I've generated an image for you: "${message}"`,
        'Spanish': `He generado una imagen para ti: "${message}"`,
        'French': `J'ai généré une image pour vous : "${message}"`,
        'German': `Ich habe ein Bild für Sie erstellt: "${message}"`,
        'Italian': `Ho generato un'immagine per te: "${message}"`,
        'Portuguese': `Gerei uma imagem para você: "${message}"`,
        'Dutch': `Ik heb een afbeelding voor je gemaakt: "${message}"`,
        'Arabic': `لقد أنشأت صورة لك: "${message}"`,
        'Chinese': `我为您生成了一张图片："${message}"`,
        'Japanese': `あなたのために画像を生成しました：「${message}」`,
        'Korean': `당신을 위해 이미지를 생성했습니다: "${message}"`,
        'Russian': `Я создал изображение для вас: "${message}"`,
        'Hindi': `मैंने आपके लिए एक छवि बनाई है: "${message}"`,
        'Thai': `ฉันได้สร้างภาพให้คุณแล้ว: "${message}"`,
        'Hebrew': `יצרתי תמונה עבורך: "${message}"`,
        'Greek': `Δημιούργησα μια εικόνα για εσάς: "${message}"`
      };

      const responseText = imageResponses[detectedLanguage] || imageResponses['English'];

      return new Response(
        JSON.stringify({ 
          response: responseText,
          imageUrl: imageUrl,
          type: 'image_generation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enhanced media processing function
    const getMediaAsBase64 = async (mediaUrl: string, mediaType: string): Promise<string> => {
      try {
        console.log('Fetching media from URL:', mediaUrl, 'Type:', mediaType)
        
        if (mediaUrl.startsWith('blob:')) {
          throw new Error('Cannot process blob URLs. Please upload the file directly.')
        }
        
        const response = await fetch(mediaUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MediaBot/1.0)',
            'Accept': '*/*'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const sizeInMB = arrayBuffer.byteLength / (1024 * 1024)
        console.log('Media size:', sizeInMB.toFixed(2), 'MB')
        
        // Video files can be larger
        let maxSize = mediaType.startsWith('video/') ? 100 : 20;
        
        if (sizeInMB > maxSize) {
          throw new Error(`Media file too large: ${sizeInMB.toFixed(2)}MB. Maximum size is ${maxSize}MB.`)
        }
        
        // Improved base64 conversion
        const uint8Array = new Uint8Array(arrayBuffer)
        let binaryString = ''
        const chunkSize = 8192
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize)
          binaryString += String.fromCharCode.apply(null, Array.from(chunk))
        }
        
        const base64 = btoa(binaryString)
        console.log('Successfully converted media to base64, length:', base64.length)
        return base64
      } catch (error) {
        console.error('Error converting media to base64:', error)
        throw error
      }
    }

    // Handle advanced reasoning and deep search
    let enhancedMessage = message
    let searchContext = ''
    
    if (enableSearch && message && !media_url) {
      try {
        console.log('Performing deep search for:', message)
        searchContext = await performDeepSearch(message)
        console.log('Deep search completed successfully')
      } catch (error) {
        console.error('Deep search failed:', error)
        // Continue without search if it fails
      }
    }
    
    if (enableReasoning && message && !media_url) {
      try {
        console.log('Performing advanced reasoning for:', message)
        enhancedMessage = await performAdvancedReasoning(message, searchContext)
        console.log('Advanced reasoning completed successfully')
      } catch (error) {
        console.error('Advanced reasoning failed:', error)
        // Fall back to original message if reasoning fails
        enhancedMessage = message
      }
    }

    const contents = []
    
    let systemInstruction = getLanguageInstruction(detectedLanguage || 'English')
    
    // Enhance system instruction if search context is available
    if (searchContext) {
      systemInstruction += ` You have access to the following up-to-date search information: ${searchContext.substring(0, 1000)}...`
    }
    
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user'
        contents.push({
          role: role,
          parts: [{ text: msg.content }]
        })
      })
    }
    
    if (media_url && media_type) {
      console.log('Analyzing media:', media_type, 'from URL:', media_url)

      try {
        if (media_type.startsWith('image/')) {
          await checkAndIncrementUsage('image_analysis')
        } else if (media_type.startsWith('video/')) {
          await checkAndIncrementUsage('video_analysis')
        }
      } catch (error) {
        console.error('Usage limit error for media analysis:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }
      
      const parts = []
      
      if (message) {
        parts.push({ text: message })
      }

      try {
        const base64Data = await getMediaAsBase64(media_url, media_type)
        parts.push({
          inline_data: {
            mime_type: media_type,
            data: base64Data
          }
        })
        console.log('Added media data to request, type:', media_type)
      } catch (error) {
        console.error('Failed to process media:', error)
        return new Response(
          JSON.stringify({ error: `Failed to process ${media_type.startsWith('video/') ? 'video' : 'media'}: ${error.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      contents.push({ 
        role: 'user',
        parts 
      })
    } else {
      // Track usage for text generation
      try {
        await checkAndIncrementUsage('text_generation')
      } catch (error) {
        console.error('Usage limit error for text generation:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }
      
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      })
    }

    console.log('Sending request to Gemini API with conversation context and language instruction')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const data = await response.json()
    console.log('Gemini API response received successfully')

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.'

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        type: 'text_response'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in chat-ai function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
