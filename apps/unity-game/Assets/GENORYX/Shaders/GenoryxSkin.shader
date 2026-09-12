Shader "GENORYX/CharacterSkin"
{
    Properties
    {
        _BaseMap ("Albedo", 2D) = "white" {}
        _BaseColor ("Base Color", Color) = (1,1,1,1)
        _TargetSkinColor ("Target Skin Color", Color) = (0.82,0.64,0.50,1)
        _SkinTint ("Skin Tint", Color) = (1,1,1,1)
        _PreserveLighting ("Preserve Lighting", Range(0,1)) = 1
        _RecolorAmount ("Recolor Amount", Range(0,1)) = 0.92
        _Smoothness ("Smoothness", Range(0,1)) = 0.32
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" "Queue"="Geometry" }
        Pass
        {
            Name "Forward"
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            TEXTURE2D(_BaseMap); SAMPLER(sampler_BaseMap);
            float4 _BaseColor;
            float4 _TargetSkinColor;
            float4 _SkinTint;
            float _PreserveLighting;
            float _RecolorAmount;
            float _Smoothness;

            struct Attr { float4 positionOS : POSITION; float3 normalOS : NORMAL; float2 uv : TEXCOORD0; };
            struct V2F { float4 positionCS : SV_POSITION; float2 uv : TEXCOORD0; float3 normalWS : TEXCOORD1; float3 posWS : TEXCOORD2; };

            V2F vert(Attr v)
            {
                V2F o;
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.uv = v.uv;
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.posWS = TransformObjectToWorld(v.positionOS.xyz);
                return o;
            }

            float Luma(float3 c)
            {
                return dot(c, float3(0.2126, 0.7152, 0.0722));
            }

            float4 frag(V2F i) : SV_Target
            {
                float4 sampled = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv) * _BaseColor;
                float3 baseRgb = sampled.rgb;
                float luma = max(Luma(baseRgb), 0.02);
                float3 target = _TargetSkinColor.rgb;
                if (Luma(_SkinTint.rgb) < 0.98)
                {
                    target = _SkinTint.rgb;
                }

                float targetLuma = max(Luma(target), 0.12);
                float3 targetChroma = target / targetLuma;
                float outLuma = lerp(luma, lerp(luma, targetLuma, 0.35) * saturate(luma / 0.45), _PreserveLighting);
                outLuma = max(outLuma, luma * 0.42);
                outLuma = max(outLuma, 0.08);
                float3 recolored = targetChroma * outLuma;
                float3 albedo = lerp(baseRgb, recolored, _RecolorAmount);

                Light light = GetMainLight();
                float ndl = saturate(dot(normalize(i.normalWS), light.direction));
                float3 color = albedo * (ndl * light.color + 0.42);
                return float4(color, sampled.a);
            }
            ENDHLSL
        }
    }
    FallBack "Hidden/Universal Render Pipeline/FallbackError"
}
