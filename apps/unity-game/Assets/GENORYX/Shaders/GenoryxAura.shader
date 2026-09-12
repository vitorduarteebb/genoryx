// Aura das criaturas. Existe porque depender de Shader.Find nos shaders de particula do
// URP nao e confiavel no player: setar _Surface/_Blend por script nao troca o estado de
// blend real do material, entao o billboard saia como quadrado opaco no WebGL. Aqui o
// blend aditivo e ZWrite off sao fixos no passe, sem keyword nem configuracao externa.
Shader "GENORYX/Aura"
{
    Properties
    {
        _BaseMap   ("Sprite", 2D) = "white" {}
        _BaseColor ("Tint", Color) = (1,1,1,1)
    }

    SubShader
    {
        Tags
        {
            "RenderType" = "Transparent"
            "RenderPipeline" = "UniversalPipeline"
            "Queue" = "Transparent"
            "IgnoreProjector" = "True"
            "PreviewType" = "Plane"
        }

        Pass
        {
            Name "AuraAdditive"
            Tags { "LightMode" = "UniversalForward" }

            Blend SrcAlpha One
            ZWrite Off
            Cull Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);

            CBUFFER_START(UnityPerMaterial)
                float4 _BaseMap_ST;
                float4 _BaseColor;
            CBUFFER_END

            struct Attributes
            {
                float4 positionOS : POSITION;
                float2 uv         : TEXCOORD0;
                float4 color      : COLOR;
            };

            struct Varyings
            {
                float4 positionHCS : SV_POSITION;
                float2 uv          : TEXCOORD0;
                float4 color       : COLOR;
            };

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.positionHCS = TransformObjectToHClip(input.positionOS.xyz);
                output.uv = TRANSFORM_TEX(input.uv, _BaseMap);
                output.color = input.color;
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                // A cor por particula vem do ParticleSystem em input.color; o sprite
                // radial da a borda suave. Aditivo: alpha zero nao escurece o fundo.
                half4 sprite = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, input.uv);
                half4 tint = sprite * input.color * _BaseColor;
                return half4(tint.rgb * tint.a, tint.a);
            }
            ENDHLSL
        }
    }

    Fallback Off
}
