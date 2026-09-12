Shader "GENORYX/Creature"
{
    Properties
    {
        _PrimaryColor      ("Primary Color", Color) = (0.235, 0.251, 0.290, 1)
        _SecondaryColor    ("Secondary Color", Color) = (0.380, 0.392, 0.427, 1)
        _PatternColor      ("Pattern Color", Color) = (0.902, 0.365, 0.129, 1)
        _PatternMode       ("Pattern Mode", Float) = 0
        _PatternScale      ("Pattern Scale", Float) = 1
        _PatternStrength   ("Pattern Strength", Range(0,1)) = 1
        _EmissionColor     ("Emission Color", Color) = (0, 0, 0, 1)
        _EmissionIntensity ("Emission Intensity", Float) = 0
        _EmissionMask      ("Emission Mask Mode", Float) = 0
        _Smoothness        ("Smoothness", Range(0,1)) = 0.35
        _Metallic          ("Metallic", Range(0,1)) = 0.0
        _Occlusion         ("Occlusion", Range(0,1)) = 1.0
        _RimColor          ("Rim Color", Color) = (1,1,1,1)
        _RimPower          ("Rim Power", Range(0.5,8)) = 3.2
        _RimStrength       ("Rim Strength", Range(0,2)) = 0.18
        _BellyLift         ("Belly Secondary Blend", Range(0,1)) = 0.55
        [HideInInspector] _Cull ("Cull", Float) = 2
    }

    SubShader
    {
        Tags
        {
            "RenderType" = "Opaque"
            "RenderPipeline" = "UniversalPipeline"
            "UniversalMaterialType" = "Lit"
            "Queue" = "Geometry"
        }

        LOD 300

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

        CBUFFER_START(UnityPerMaterial)
            float4 _PrimaryColor;
            float4 _SecondaryColor;
            float4 _PatternColor;
            float  _PatternMode;
            float  _PatternScale;
            float  _PatternStrength;
            float4 _EmissionColor;
            float  _EmissionIntensity;
            float  _EmissionMask;
            float  _Smoothness;
            float  _Metallic;
            float  _Occlusion;
            float4 _RimColor;
            float  _RimPower;
            float  _RimStrength;
            float  _BellyLift;
            float  _Cull;
        CBUFFER_END

        float genoryxHash21(float2 p)
        {
            p = frac(p * float2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return frac(p.x * p.y);
        }

        float genoryxNoise21(float2 p)
        {
            float2 i = floor(p);
            float2 f = frac(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = genoryxHash21(i);
            float b = genoryxHash21(i + float2(1.0, 0.0));
            float c = genoryxHash21(i + float2(0.0, 1.0));
            float d = genoryxHash21(i + float2(1.0, 1.0));
            return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
        }

        float genoryxFbm(float2 p)
        {
            float v = 0.0;
            float a = 0.5;
            [unroll]
            for (int i = 0; i < 4; i++)
            {
                v += a * genoryxNoise21(p);
                p *= 2.03;
                a *= 0.5;
            }
            return v;
        }

        // PATTERN_NONE / STRIPES / VEINS / CRACKS / SCALES / GENESIS
        float genoryxPattern(float mode, float3 posOS, float2 uv)
        {
            float scale = max(_PatternScale, 0.05);
            int m = (int)round(mode);

            if (m == 1)
            {
                // 19 rad/unidade dava ~5 faixas no corpo inteiro: lia como bloco de cor,
                // nao como listra. 52 rad/unidade rende ~14 bandas no comprimento.
                float wobble = genoryxFbm(uv * 4.0) * 0.35;
                float s = sin((posOS.z * 52.0 + wobble * 6.0) * scale);
                return smoothstep(0.42, 0.76, abs(s));
            }

            // Veias e rachaduras precisam ser FINAS. Bandas largas cobriam o corpo inteiro
            // e apagavam a cor primaria, o oposto do "charcoal com rachaduras" da referencia.
            if (m == 2)
            {
                float n = genoryxFbm(posOS.zy * 9.0 * scale + posOS.x * 2.4);
                return (1.0 - smoothstep(0.0, 0.032, abs(n - 0.5))) * 0.9;
            }

            if (m == 3)
            {
                float n = abs(genoryxFbm(posOS.zy * 12.0 * scale + posOS.x * 3.1) * 2.0 - 1.0);
                float c = 1.0 - smoothstep(0.0, 0.042, n);
                float n2 = abs(genoryxFbm(posOS.xz * 15.0 * scale + 7.3) * 2.0 - 1.0);
                return saturate(c + (1.0 - smoothstep(0.0, 0.028, n2)) * 0.45) * 0.92;
            }

            if (m == 4)
            {
                float2 g = float2(uv.x * 18.0, uv.y * 11.0) * scale;
                float row = floor(g.y);
                g.x += frac(row * 0.5);
                float2 f = frac(g) - 0.5;
                float d = length(f * float2(1.0, 1.35));
                return smoothstep(0.46, 0.34, d) * 0.85;
            }

            if (m == 5)
            {
                float3 anchor = float3(0.30, 0.05, -0.02);
                float d = length(posOS - anchor);
                float rings = 0.5 + 0.5 * sin(d * 34.0 * scale);
                float n = genoryxFbm(posOS.zy * 6.0 * scale);
                return saturate(smoothstep(0.78, 0.99, rings) * 0.60 + smoothstep(0.70, 0.86, n) * 0.34);
            }

            return 0.0;
        }
        ENDHLSL

        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }
            Cull [_Cull]
            ZWrite On

            HLSLPROGRAM
            #pragma target 3.0
            #pragma vertex GenoryxVert
            #pragma fragment GenoryxFrag
            #pragma multi_compile_instancing

            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile _ _ADDITIONAL_LIGHTS_VERTEX _ADDITIONAL_LIGHTS
            #pragma multi_compile_fragment _ _ADDITIONAL_LIGHT_SHADOWS
            #pragma multi_compile_fragment _ _SHADOWS_SOFT
            #pragma multi_compile_fragment _ _SCREEN_SPACE_OCCLUSION
            #pragma multi_compile _ LIGHTMAP_ON
            #pragma multi_compile _ DIRLIGHTMAP_COMBINED
            #pragma multi_compile_fog

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                float4 tangentOS  : TANGENT;
                float2 uv         : TEXCOORD0;
                float2 lightmapUV : TEXCOORD1;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS  : SV_POSITION;
                float3 positionWS  : TEXCOORD0;
                float3 normalWS    : TEXCOORD1;
                float2 uv          : TEXCOORD2;
                float3 positionOS  : TEXCOORD3;
                float4 shadowCoord : TEXCOORD4;
                float  fogFactor   : TEXCOORD5;
                DECLARE_LIGHTMAP_OR_SH(lightmapUV, vertexSH, 6);
                UNITY_VERTEX_INPUT_INSTANCE_ID
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings GenoryxVert(Attributes input)
            {
                Varyings output = (Varyings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_TRANSFER_INSTANCE_ID(input, output);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);

                VertexPositionInputs pos = GetVertexPositionInputs(input.positionOS.xyz);
                VertexNormalInputs nrm = GetVertexNormalInputs(input.normalOS, input.tangentOS);

                output.positionCS = pos.positionCS;
                output.positionWS = pos.positionWS;
                output.normalWS = nrm.normalWS;
                output.uv = input.uv;
                output.positionOS = input.positionOS.xyz;
                output.shadowCoord = GetShadowCoord(pos);
                output.fogFactor = ComputeFogFactor(pos.positionCS.z);
                OUTPUT_LIGHTMAP_UV(input.lightmapUV, unity_LightmapST, output.lightmapUV);
                OUTPUT_SH(nrm.normalWS, output.vertexSH);
                return output;
            }

            half4 GenoryxFrag(Varyings input) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);

                float3 normalWS = normalize(input.normalWS);
                float3 viewDirWS = GetWorldSpaceNormalizeViewDir(input.positionWS);

                // Barriga puxa a cor secundaria: leitura de volume sem textura.
                float upFacing = saturate(normalWS.y * 0.5 + 0.5);
                float belly = pow(saturate(1.0 - upFacing), 1.6) * _BellyLift;
                float3 baseColor = lerp(_PrimaryColor.rgb, _SecondaryColor.rgb, belly);

                float pattern = genoryxPattern(_PatternMode, input.positionOS, input.uv) * _PatternStrength;
                baseColor = lerp(baseColor, _PatternColor.rgb, saturate(pattern));

                int emissionMode = (int)round(_EmissionMask);
                float emissionAmount = 0.0;
                if (emissionMode == 1)
                {
                    emissionAmount = pattern;
                }
                else if (emissionMode == 2)
                {
                    emissionAmount = 1.0;
                }
                float3 emission = _EmissionColor.rgb * _EmissionIntensity * emissionAmount;

                SurfaceData surface = (SurfaceData)0;
                surface.albedo = baseColor;
                surface.metallic = _Metallic;
                surface.smoothness = _Smoothness;
                surface.occlusion = _Occlusion;
                surface.emission = emission;
                surface.alpha = 1.0;
                surface.normalTS = float3(0, 0, 1);
                surface.specular = 0;
                surface.clearCoatMask = 0;
                surface.clearCoatSmoothness = 0;

                InputData inputData = (InputData)0;
                inputData.positionWS = input.positionWS;
                inputData.normalWS = normalWS;
                inputData.viewDirectionWS = viewDirWS;
                inputData.shadowCoord = input.shadowCoord;
                inputData.fogCoord = input.fogFactor;
                inputData.vertexLighting = half3(0, 0, 0);
                inputData.bakedGI = SAMPLE_GI(input.lightmapUV, input.vertexSH, normalWS);
                inputData.normalizedScreenSpaceUV = GetNormalizedScreenSpaceUV(input.positionCS);
                inputData.shadowMask = half4(1, 1, 1, 1);

                half4 color = UniversalFragmentPBR(inputData, surface);

                float rim = pow(saturate(1.0 - saturate(dot(normalWS, viewDirWS))), _RimPower);
                color.rgb += _RimColor.rgb * rim * _RimStrength;

                color.rgb = MixFog(color.rgb, input.fogFactor);
                return color;
            }
            ENDHLSL
        }

        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }
            ZWrite On
            ZTest LEqual
            ColorMask 0
            Cull [_Cull]

            HLSLPROGRAM
            #pragma target 3.0
            #pragma vertex ShadowVert
            #pragma fragment ShadowFrag
            #pragma multi_compile_instancing
            #pragma multi_compile_vertex _ _CASTING_PUNCTUAL_LIGHT_SHADOW

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"

            float3 _LightDirection;
            float3 _LightPosition;

            struct ShadowAttributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct ShadowVaryings
            {
                float4 positionCS : SV_POSITION;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            ShadowVaryings ShadowVert(ShadowAttributes input)
            {
                ShadowVaryings output = (ShadowVaryings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);

                float3 positionWS = TransformObjectToWorld(input.positionOS.xyz);
                float3 normalWS = TransformObjectToWorldNormal(input.normalOS);

                #if _CASTING_PUNCTUAL_LIGHT_SHADOW
                    float3 lightDirectionWS = normalize(_LightPosition - positionWS);
                #else
                    float3 lightDirectionWS = _LightDirection;
                #endif

                float4 positionCS = TransformWorldToHClip(ApplyShadowBias(positionWS, normalWS, lightDirectionWS));

                #if UNITY_REVERSED_Z
                    positionCS.z = min(positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #else
                    positionCS.z = max(positionCS.z, UNITY_NEAR_CLIP_VALUE);
                #endif

                output.positionCS = positionCS;
                return output;
            }

            half4 ShadowFrag(ShadowVaryings input) : SV_TARGET
            {
                return 0;
            }
            ENDHLSL
        }

        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }
            ZWrite On
            ColorMask R
            Cull [_Cull]

            HLSLPROGRAM
            #pragma target 3.0
            #pragma vertex DepthVert
            #pragma fragment DepthFrag
            #pragma multi_compile_instancing

            struct DepthAttributes
            {
                float4 positionOS : POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct DepthVaryings
            {
                float4 positionCS : SV_POSITION;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            DepthVaryings DepthVert(DepthAttributes input)
            {
                DepthVaryings output = (DepthVaryings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                return output;
            }

            half4 DepthFrag(DepthVaryings input) : SV_TARGET
            {
                return 0;
            }
            ENDHLSL
        }

        Pass
        {
            Name "DepthNormals"
            Tags { "LightMode" = "DepthNormals" }
            ZWrite On
            Cull [_Cull]

            HLSLPROGRAM
            #pragma target 3.0
            #pragma vertex DepthNormalsVert
            #pragma fragment DepthNormalsFrag
            #pragma multi_compile_instancing

            struct DNAttributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct DNVaryings
            {
                float4 positionCS : SV_POSITION;
                float3 normalWS   : TEXCOORD0;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            DNVaryings DepthNormalsVert(DNAttributes input)
            {
                DNVaryings output = (DNVaryings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                return output;
            }

            half4 DepthNormalsFrag(DNVaryings input) : SV_TARGET
            {
                return half4(NormalizeNormalPerPixel(input.normalWS), 0.0);
            }
            ENDHLSL
        }
    }

    FallBack "Universal Render Pipeline/Lit"
}
