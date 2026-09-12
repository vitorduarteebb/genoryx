using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Contrato permanente de sockets do GENORYX_CORE_CHASSIS_V1.
    /// Nenhuma peca pode mover estes pontos: a peca se adapta ao chassi.
    /// </summary>
    public static class CreatureSockets
    {
        public const string Root = "GenoryxRoot";
        public const string Body = "Body";
        public const string Head = "Head";
        public const string EyeL = "EyeSocket_L";
        public const string EyeR = "EyeSocket_R";
        public const string HornL = "HornSocket_L";
        public const string HornR = "HornSocket_R";
        public const string FrontLimbL = "FrontLimb_L";
        public const string FrontFootL = "FrontFoot_L";
        public const string FrontLimbR = "FrontLimb_R";
        public const string FrontFootR = "FrontFoot_R";
        public const string RearLimbL = "RearLimb_L";
        public const string RearFootL = "RearFoot_L";
        public const string RearLimbR = "RearLimb_R";
        public const string RearFootR = "RearFoot_R";
        public const string TailRoot = "TailRoot";
        public const string TailMid = "TailMid";
        public const string TailTip = "TailTip";
        public const string BackL = "BackSocket_L";
        public const string BackR = "BackSocket_R";
        public const string Core = "CoreSocket";

        /// <summary>Ordem canonica do array de bones. Indice = bone index em todo mesh skinado.</summary>
        public static readonly string[] BoneOrder =
        {
            Root,
            Body,
            Head,
            EyeL,
            EyeR,
            HornL,
            HornR,
            FrontLimbL,
            FrontFootL,
            FrontLimbR,
            FrontFootR,
            RearLimbL,
            RearFootL,
            RearLimbR,
            RearFootR,
            TailRoot,
            TailMid,
            TailTip,
            BackL,
            BackR,
            Core
        };

        public const int BoneCount = 21;

        public static int Index(string bone)
        {
            for (var i = 0; i < BoneOrder.Length; i++)
            {
                if (BoneOrder[i] == bone)
                {
                    return i;
                }
            }

            return -1;
        }

        /// <summary>Posicao de repouso local (relativa ao pai imediato) de cada bone.</summary>
        public static Vector3 RestLocalPosition(string bone)
        {
            return bone switch
            {
                Root => Vector3.zero,
                Body => new Vector3(0f, CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.BodyPivotZ),
                Head => new Vector3(0f, CreatureChassisSpec.HeadY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.HeadZ - CreatureChassisSpec.BodyPivotZ),
                EyeL => new Vector3(-CreatureChassisSpec.EyeX, CreatureChassisSpec.EyeY - CreatureChassisSpec.HeadY, CreatureChassisSpec.EyeZ - CreatureChassisSpec.HeadZ),
                EyeR => new Vector3(CreatureChassisSpec.EyeX, CreatureChassisSpec.EyeY - CreatureChassisSpec.HeadY, CreatureChassisSpec.EyeZ - CreatureChassisSpec.HeadZ),
                HornL => new Vector3(-CreatureChassisSpec.HornX, CreatureChassisSpec.HornY - CreatureChassisSpec.HeadY, CreatureChassisSpec.HornZ - CreatureChassisSpec.HeadZ),
                HornR => new Vector3(CreatureChassisSpec.HornX, CreatureChassisSpec.HornY - CreatureChassisSpec.HeadY, CreatureChassisSpec.HornZ - CreatureChassisSpec.HeadZ),
                FrontLimbL => new Vector3(-CreatureChassisSpec.FrontLimbX, CreatureChassisSpec.LimbY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.FrontLimbZ - CreatureChassisSpec.BodyPivotZ),
                FrontLimbR => new Vector3(CreatureChassisSpec.FrontLimbX, CreatureChassisSpec.LimbY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.FrontLimbZ - CreatureChassisSpec.BodyPivotZ),
                RearLimbL => new Vector3(-CreatureChassisSpec.RearLimbX, CreatureChassisSpec.LimbY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.RearLimbZ - CreatureChassisSpec.BodyPivotZ),
                RearLimbR => new Vector3(CreatureChassisSpec.RearLimbX, CreatureChassisSpec.LimbY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.RearLimbZ - CreatureChassisSpec.BodyPivotZ),
                FrontFootL or FrontFootR or RearFootL or RearFootR => new Vector3(0f, CreatureChassisSpec.FootY - CreatureChassisSpec.LimbY, 0f),
                TailRoot => new Vector3(0f, CreatureChassisSpec.TailY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.TailZ - CreatureChassisSpec.BodyPivotZ),
                TailMid => new Vector3(0f, 0.012f, -CreatureChassisSpec.TailSegment),
                TailTip => new Vector3(0f, 0.010f, -CreatureChassisSpec.TailSegment),
                BackL => new Vector3(-CreatureChassisSpec.BackX, CreatureChassisSpec.BackY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.BackZ - CreatureChassisSpec.BodyPivotZ),
                BackR => new Vector3(CreatureChassisSpec.BackX, CreatureChassisSpec.BackY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.BackZ - CreatureChassisSpec.BodyPivotZ),
                Core => new Vector3(CreatureChassisSpec.CoreX, CreatureChassisSpec.CoreY - CreatureChassisSpec.BodyPivotY, CreatureChassisSpec.CoreZ - CreatureChassisSpec.BodyPivotZ),
                _ => Vector3.zero
            };
        }

        public static string ParentOf(string bone)
        {
            return bone switch
            {
                Root => null,
                Body => Root,
                Head => Body,
                EyeL or EyeR or HornL or HornR => Head,
                FrontFootL => FrontLimbL,
                FrontFootR => FrontLimbR,
                RearFootL => RearLimbL,
                RearFootR => RearLimbR,
                TailMid => TailRoot,
                TailTip => TailMid,
                _ => Body
            };
        }

        public static Quaternion RestLocalRotation(string bone)
        {
            return bone switch
            {
                Core => Quaternion.Euler(0f, 0f, -8f),
                // Back sockets ficam alinhados com o mundo de proposito: a peca precisa
                // acompanhar a curva do dorso ao longo de Z, e um roll no socket
                // desalinharia esse calculo em CreatureMeshLab.RidgeDrop.
                BackL or BackR => Quaternion.identity,
                HornL => Quaternion.Euler(-12f, 0f, 14f),
                HornR => Quaternion.Euler(-12f, 0f, -14f),
                _ => Quaternion.identity
            };
        }
    }

    /// <summary>
    /// Medidas canonicas do chassi adulto, em metros.
    /// Proporcoes seguem a spec: comprimento = 1.4 x altura, largura = 0.75 x comprimento,
    /// cabeca = 35-40% da massa visual frontal.
    /// </summary>
    public static class CreatureChassisSpec
    {
        public const float Height = 0.552f;
        public const float Length = 0.785f;
        public const float Width = 0.584f;

        /// <summary>
        /// Fronteira corpo/cabeca. As duas malhas se ENCOSTAM aqui em vez de se sobrepor
        /// na superficie: superficies coincidentes brigavam por profundidade e desenhavam
        /// um vinco no pescoco, exatamente o que a referencia nao tem. A cabeca continua
        /// alguns centimetros para tras desta linha, mas encolhida para dentro da carne,
        /// onde tapa qualquer fenda ao girar o bone sem aparecer.
        /// </summary>
        public const float BodyFrontZ = 0.160f;
        public const float BodyRearZ = -0.440f;

        /// <summary>Recuo interno da cabeca atras da fronteira. Fica submerso no corpo.</summary>
        public const float HeadTuckZ = 0.070f;
        public const float HeadStartZ = BodyFrontZ - HeadTuckZ;
        public const float NoseZ = 0.345f;

        /// <summary>
        /// Barriga a 0.148 do chao. Em 0.20 as pernas ocupavam um terco da altura e a
        /// criatura lia como quadrupede pernalta, nao como o bloco baixo e robusto da
        /// referencia. Este valor deixa 14cm de vao — perna visivel, barriga proxima
        /// do chao sem encostar.
        /// </summary>
        public const float BellyY = 0.148f;

        public const float BodyPivotY = 0.360f;
        public const float BodyPivotZ = -0.130f;

        // Pivo da cabeca no pescoco, dentro do corpo: girar o bone vira aceno, nao decapitacao.
        public const float HeadY = 0.340f;
        public const float HeadZ = 0.140f;
        public const float HeadLength = NoseZ - BodyFrontZ;

        // Os sockets marcam ANATOMIA (altura e profundidade). O raio nao precisa ser exato:
        // CreatureAssembler.ReseatRigidParts desliza a peca ao longo do proprio eixo ate
        // pousar na pele da cabeca escolhida, o que mantem o encaixe em qualquer estilo.
        // Olho na FACE, nao no flanco: em vista frontal a criatura precisa ter cara. Mais a
        // frente e um pouco abaixo do topo do cranio, que e onde a referencia coloca.
        public const float EyeX = 0.112f;
        public const float EyeY = 0.338f;
        public const float EyeZ = 0.300f;

        public const float HornX = 0.075f;
        public const float HornY = 0.420f;
        public const float HornZ = 0.190f;

        // Pernas nos quatro cantos inferiores, projetadas cerca de cinco centimetros alem
        // do flanco. Alinhadas com a silhueta elas sumiam na sombra do corpo em camera
        // 3/4, e leitura de silhueta e o requisito numero um do chassi.
        // Perna sob o corpo, nao ao lado dele. Em 0.215 o topo da perna caia fora da pele
        // (que na altura do ombro ja fechou para ~0.21) e a perna lia como bloco solto
        // encostado no flanco. Em 0.178 o topo entra na carne e a juncao some.
        public const float FrontLimbX = 0.178f;
        public const float FrontLimbZ = 0.090f;
        public const float RearLimbX = 0.178f;
        public const float RearLimbZ = -0.300f;
        public const float LimbY = 0.168f;
        public const float FootY = 0.026f;

        public const float TailY = 0.330f;
        public const float TailZ = -0.415f;
        public const float TailSegment = 0.105f;

        public const float BackX = 0.095f;
        public const float BackY = 0.520f;
        public const float BackZ = -0.140f;

        // Core no PEITO/flanco frontal, abaixo da linha media: no meio do flanco alto ele
        // lia como adesivo no lombo. Aqui ele fica onde a referencia poe — logo atras do
        // ombro, na parte cheia do torax.
        public const float CoreX = 0.230f;
        public const float CoreY = 0.300f;
        public const float CoreZ = 0.030f;
    }
}
