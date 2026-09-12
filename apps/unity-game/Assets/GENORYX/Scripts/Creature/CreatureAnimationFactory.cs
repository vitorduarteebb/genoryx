using System;
using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    public enum CreatureClip
    {
        Idle,
        Walk,
        Run,
        Attack01Body,
        Attack02Core,
        Hit,
        Death,
        Victory,
        Sleep,
        Eat,
        Happy,
        CaptureReaction,
        Spawn
    }

    /// <summary>
    /// Pose delta de um bone em um instante normalizado da animacao.
    /// Offsets sao somados a pose de repouso do GENORYX_CORE_RIG.
    /// </summary>
    public struct BonePose
    {
        public Vector3 position;
        public Vector3 rotation;

        public static readonly BonePose Zero = new BonePose { position = Vector3.zero, rotation = Vector3.zero };
    }

    /// <summary>
    /// Gera todos os AnimationClips do chassi V1 por amostragem de pose.
    /// Um unico rig, um unico conjunto de clipes: toda combinacao de pecas anima igual.
    /// </summary>
    public static class CreatureAnimationFactory
    {
        public const string SkeletonPrefix = "CreatureVisualRoot/SkeletonRoot/";
        public const int SampleRate = 30;

        /// <summary>Bones escritos por TODO clipe. Conjunto identico evita vazamento de pose entre estados.</summary>
        public static readonly string[] AnimatedBones =
        {
            CreatureSockets.Body,
            CreatureSockets.Head,
            CreatureSockets.FrontLimbL,
            CreatureSockets.FrontFootL,
            CreatureSockets.FrontLimbR,
            CreatureSockets.FrontFootR,
            CreatureSockets.RearLimbL,
            CreatureSockets.RearFootL,
            CreatureSockets.RearLimbR,
            CreatureSockets.RearFootR,
            CreatureSockets.TailRoot,
            CreatureSockets.TailMid,
            CreatureSockets.TailTip
        };

        public static string ClipName(CreatureClip clip)
        {
            return clip switch
            {
                CreatureClip.Idle => "IDLE",
                CreatureClip.Walk => "WALK",
                CreatureClip.Run => "RUN",
                CreatureClip.Attack01Body => "ATTACK_01_BODY",
                CreatureClip.Attack02Core => "ATTACK_02_CORE",
                CreatureClip.Hit => "HIT",
                CreatureClip.Death => "DEATH",
                CreatureClip.Victory => "VICTORY",
                CreatureClip.Sleep => "SLEEP",
                CreatureClip.Eat => "EAT",
                CreatureClip.Happy => "HAPPY",
                CreatureClip.CaptureReaction => "CAPTURE_REACTION",
                CreatureClip.Spawn => "SPAWN",
                _ => clip.ToString().ToUpperInvariant()
            };
        }

        /// <summary>
        /// Nome do estado que hospeda a Blend Tree de locomocao.
        /// IDLE/WALK/RUN nao existem como estados: sao filhos dela, escolhidos por Speed.
        /// </summary>
        public const string LocomotionState = "Locomotion";

        public static float Duration(CreatureClip clip)
        {
            return clip switch
            {
                CreatureClip.Idle => 2.40f,
                CreatureClip.Walk => 1.00f,
                CreatureClip.Run => 0.62f,
                CreatureClip.Attack01Body => 0.85f,
                CreatureClip.Attack02Core => 1.10f,
                CreatureClip.Hit => 0.45f,
                CreatureClip.Death => 1.60f,
                CreatureClip.Victory => 1.80f,
                CreatureClip.Sleep => 3.20f,
                CreatureClip.Eat => 1.40f,
                CreatureClip.Happy => 1.00f,
                CreatureClip.CaptureReaction => 1.20f,
                CreatureClip.Spawn => 1.00f,
                _ => 1f
            };
        }

        public static bool Loops(CreatureClip clip)
        {
            return clip is CreatureClip.Idle or CreatureClip.Walk or CreatureClip.Run
                or CreatureClip.Sleep or CreatureClip.Eat or CreatureClip.Happy;
        }

        public static AnimationClip Build(CreatureClip clip)
        {
            var duration = Duration(clip);
            var loops = Loops(clip);
            var frames = Mathf.Max(2, Mathf.RoundToInt(duration * SampleRate));

            var result = new AnimationClip
            {
                name = ClipName(clip),
                frameRate = SampleRate,
                legacy = false
            };

            var curves = new Dictionary<string, AnimationCurve>();

            for (var f = 0; f <= frames; f++)
            {
                var t = (float)f / frames;
                var time = t * duration;
                var sampleT = loops && f == frames ? 0f : t;

                for (var b = 0; b < AnimatedBones.Length; b++)
                {
                    var bone = AnimatedBones[b];
                    var pose = Sample(clip, bone, sampleT);
                    var rest = CreatureSockets.RestLocalPosition(bone);
                    var restEuler = CreatureSockets.RestLocalRotation(bone).eulerAngles;

                    var path = SkeletonPrefix + CreatureRig.Path(bone);

                    if (bone == CreatureSockets.Body)
                    {
                        AddKey(curves, path, "m_LocalPosition.x", time, rest.x + pose.position.x);
                        AddKey(curves, path, "m_LocalPosition.y", time, rest.y + pose.position.y);
                        AddKey(curves, path, "m_LocalPosition.z", time, rest.z + pose.position.z);
                    }

                    AddKey(curves, path, "localEulerAnglesRaw.x", time, Wrap(restEuler.x) + pose.rotation.x);
                    AddKey(curves, path, "localEulerAnglesRaw.y", time, Wrap(restEuler.y) + pose.rotation.y);
                    AddKey(curves, path, "localEulerAnglesRaw.z", time, Wrap(restEuler.z) + pose.rotation.z);
                }
            }

            foreach (var pair in curves)
            {
                var split = pair.Key.IndexOf('|');
                var path = pair.Key.Substring(0, split);
                var property = pair.Key.Substring(split + 1);
                Smooth(pair.Value);
                result.SetCurve(path, typeof(Transform), property, pair.Value);
            }

            ApplyLoop(result, loops);
            result.EnsureQuaternionContinuity();
            return result;
        }

        /// <summary>AnimationUtility so existe no Editor; runtime cai no wrapMode.</summary>
        static void ApplyLoop(AnimationClip clip, bool loops)
        {
#if UNITY_EDITOR
            var settings = UnityEditor.AnimationUtility.GetAnimationClipSettings(clip);
            settings.loopTime = loops;
            UnityEditor.AnimationUtility.SetAnimationClipSettings(clip, settings);
#endif
            clip.wrapMode = loops ? WrapMode.Loop : WrapMode.ClampForever;
        }

        static float Wrap(float euler)
        {
            return euler > 180f ? euler - 360f : euler;
        }

        static void AddKey(Dictionary<string, AnimationCurve> curves, string path, string property, float time, float value)
        {
            var key = path + "|" + property;
            if (!curves.TryGetValue(key, out var curve))
            {
                curve = new AnimationCurve();
                curves[key] = curve;
            }

            curve.AddKey(new Keyframe(time, value));
        }

        static void Smooth(AnimationCurve curve)
        {
            for (var i = 0; i < curve.length; i++)
            {
                curve.SmoothTangents(i, 0f);
            }
        }

        // ------------------------------------------------------- POSE SAMPLER

        static float Wave(float t, float phase)
        {
            return Mathf.Sin((t + phase) * Mathf.PI * 2f);
        }

        static float LimbPhase(string bone)
        {
            // Marcha diagonal: dianteira esquerda acompanha traseira direita.
            return bone switch
            {
                CreatureSockets.FrontLimbL or CreatureSockets.FrontFootL => 0f,
                CreatureSockets.RearLimbR or CreatureSockets.RearFootR => 0.06f,
                CreatureSockets.FrontLimbR or CreatureSockets.FrontFootR => 0.5f,
                CreatureSockets.RearLimbL or CreatureSockets.RearFootL => 0.56f,
                _ => 0f
            };
        }

        static bool IsFoot(string bone)
        {
            return bone is CreatureSockets.FrontFootL or CreatureSockets.FrontFootR
                or CreatureSockets.RearFootL or CreatureSockets.RearFootR;
        }

        static bool IsLimb(string bone)
        {
            return bone is CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR
                or CreatureSockets.RearLimbL or CreatureSockets.RearLimbR;
        }

        static float TailIndex(string bone)
        {
            return bone switch
            {
                CreatureSockets.TailRoot => 0f,
                CreatureSockets.TailMid => 1f,
                CreatureSockets.TailTip => 2f,
                _ => -1f
            };
        }

        static BonePose Sample(CreatureClip clip, string bone, float t)
        {
            return clip switch
            {
                CreatureClip.Idle => Idle(bone, t),
                CreatureClip.Walk => Gait(bone, t, 1f),
                CreatureClip.Run => Gait(bone, t, 1.85f),
                CreatureClip.Attack01Body => AttackBody(bone, t),
                CreatureClip.Attack02Core => AttackCore(bone, t),
                CreatureClip.Hit => Hit(bone, t),
                CreatureClip.Death => Death(bone, t),
                CreatureClip.Victory => Victory(bone, t),
                CreatureClip.Sleep => Sleep(bone, t),
                CreatureClip.Eat => Eat(bone, t),
                CreatureClip.Happy => Happy(bone, t),
                CreatureClip.CaptureReaction => CaptureReaction(bone, t),
                CreatureClip.Spawn => Spawn(bone, t),
                _ => BonePose.Zero
            };
        }

        /// <summary>Idle precisa transmitir vida: respiracao, cabeca, cauda e costas.</summary>
        static BonePose Idle(string bone, float t)
        {
            var pose = BonePose.Zero;
            var breath = Wave(t, 0f);
            var slow = Wave(t * 0.5f, 0.15f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, breath * 0.0075f, 0f);
                pose.rotation = new Vector3(breath * 1.1f, slow * 0.9f, Wave(t * 0.5f, 0.4f) * 0.7f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(-breath * 1.6f + slow * 1.2f, slow * 3.4f, Wave(t * 0.5f, 0.62f) * 1.5f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                var lag = tail * 0.11f;
                var amp = 4.5f + tail * 3.6f;
                pose.rotation = new Vector3(Wave(t * 0.5f, 0.2f - lag) * (1.4f + tail), Wave(t, -lag) * amp, 0f);
                return pose;
            }

            if (IsLimb(bone) || IsFoot(bone))
            {
                pose.rotation = new Vector3(breath * 0.5f, 0f, 0f);
            }

            return pose;
        }

        /// <summary>Walk e Run compartilham a mesma marcha; energy escala amplitude e inclinacao.</summary>
        static BonePose Gait(string bone, float t, float energy)
        {
            var pose = BonePose.Zero;

            if (bone == CreatureSockets.Body)
            {
                var bob = Mathf.Abs(Mathf.Sin(t * Mathf.PI * 2f)) - 0.5f;
                pose.position = new Vector3(0f, bob * 0.020f * energy, 0f);
                pose.rotation = new Vector3(
                    -3.2f * (energy - 1f) + Wave(t * 2f, 0f) * 1.6f * energy,
                    0f,
                    Wave(t, 0.25f) * 2.1f * energy);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(
                    -1.4f * (energy - 1f) - Wave(t * 2f, 0.1f) * 1.8f * energy,
                    Wave(t, 0.3f) * 2.2f,
                    Wave(t, 0.25f) * -1.6f * energy);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                var lag = tail * 0.13f;
                pose.rotation = new Vector3(
                    -4f * (energy - 1f) + Wave(t * 2f, -lag) * (1.8f + tail * 1.2f),
                    Wave(t, 0.15f - lag) * (7f + tail * 5.5f) * energy,
                    0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                var phase = LimbPhase(bone);
                pose.rotation = new Vector3(Wave(t, phase) * 21f * energy, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                var phase = LimbPhase(bone);
                pose.rotation = new Vector3(Wave(t, phase - 0.14f) * -13f * energy, 0f, 0f);
                return pose;
            }

            return pose;
        }

        static float Bell(float t, float center, float width)
        {
            var x = Mathf.Clamp01(1f - Mathf.Abs(t - center) / width);
            return x * x * (3f - 2f * x);
        }

        /// <summary>Avanco com investida de cabeca. Generico o bastante para qualquer especie.</summary>
        static BonePose AttackBody(string bone, float t)
        {
            var pose = BonePose.Zero;
            var wind = Bell(t, 0.16f, 0.20f);
            var strike = Bell(t, 0.40f, 0.18f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, wind * 0.020f + strike * -0.012f, strike * 0.115f - wind * 0.030f);
                pose.rotation = new Vector3(wind * 9f - strike * 15f, 0f, 0f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(wind * 14f - strike * 26f, 0f, 0f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(wind * -8f + strike * 12f * (1f + tail * 0.4f), strike * 6f, 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                var front = bone is CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR;
                pose.rotation = new Vector3(front ? -wind * 16f + strike * 26f : wind * 10f - strike * 8f, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3(strike * -14f, 0f, 0f);
            }

            return pose;
        }

        /// <summary>Canalizacao pelo Genesis Core. Mesma animacao para todo elemento; so o VFX muda.</summary>
        static BonePose AttackCore(string bone, float t)
        {
            var pose = BonePose.Zero;
            var charge = Bell(t, 0.34f, 0.34f);
            var release = Bell(t, 0.68f, 0.16f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, charge * 0.034f, charge * -0.040f + release * 0.045f);
                pose.rotation = new Vector3(-charge * 13f + release * 11f, 0f, 0f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(-charge * 20f + release * 16f, 0f, 0f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(charge * 11f * (1f + tail * 0.5f), Mathf.Sin(t * 18f) * charge * 5f, 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                var front = bone is CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR;
                pose.rotation = new Vector3(front ? charge * 14f : -charge * 7f, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3(-charge * 9f, 0f, 0f);
            }

            return pose;
        }

        static BonePose Hit(string bone, float t)
        {
            var pose = BonePose.Zero;
            var impact = Bell(t, 0.18f, 0.22f);
            var settle = Bell(t, 0.55f, 0.35f) * 0.35f;
            var shake = Mathf.Sin(t * 42f) * Mathf.Exp(-t * 6f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(shake * 0.010f, -impact * 0.020f, -impact * 0.055f);
                pose.rotation = new Vector3(impact * 11f - settle * 5f, shake * 3f, impact * 7f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(impact * 17f, shake * 6f, impact * -9f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(impact * -9f, shake * (5f + tail * 4f), 0f);
                return pose;
            }

            if (IsLimb(bone) || IsFoot(bone))
            {
                pose.rotation = new Vector3(impact * (IsFoot(bone) ? 9f : -12f), 0f, 0f);
            }

            return pose;
        }

        static BonePose Death(string bone, float t)
        {
            var pose = BonePose.Zero;
            var fall = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01((t - 0.10f) / 0.55f));
            var settle = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01((t - 0.55f) / 0.45f));
            var stagger = Bell(t, 0.08f, 0.14f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, -fall * 0.165f + stagger * 0.020f, -fall * 0.030f);
                pose.rotation = new Vector3(stagger * 8f - fall * 6f, 0f, fall * 52f + settle * 6f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(fall * 24f, fall * -14f, -fall * 18f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(fall * (10f + tail * 6f), fall * (12f + tail * 9f), 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                var left = bone is CreatureSockets.FrontLimbL or CreatureSockets.RearLimbL;
                pose.rotation = new Vector3(fall * 44f, 0f, left ? fall * 16f : -fall * 24f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3(-fall * 26f, 0f, 0f);
            }

            return pose;
        }

        static BonePose Victory(string bone, float t)
        {
            var pose = BonePose.Zero;
            var rear = Bell(t, 0.34f, 0.34f);
            var wag = Mathf.Sin(t * Mathf.PI * 8f);
            var hop = Mathf.Abs(Mathf.Sin(t * Mathf.PI * 3f));

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, rear * 0.055f + hop * 0.018f, -rear * 0.030f);
                pose.rotation = new Vector3(-rear * 17f, 0f, 0f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(-rear * 22f, wag * 4f, 0f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(rear * 12f, wag * (10f + tail * 8f), 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                var front = bone is CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR;
                pose.rotation = new Vector3(front ? -rear * 34f : rear * 8f, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3(rear * 14f, 0f, 0f);
            }

            return pose;
        }

        static BonePose Sleep(string bone, float t)
        {
            var pose = BonePose.Zero;
            var breath = Wave(t, 0f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, -0.088f + breath * 0.010f, 0f);
                pose.rotation = new Vector3(breath * 1.3f, 0f, 3.5f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(21f + breath * 1.4f, -8f, -5f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(6f, 16f + breath * (2f + tail * 1.5f), 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                pose.rotation = new Vector3(38f, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3(-22f, 0f, 0f);
            }

            return pose;
        }

        static BonePose Eat(string bone, float t)
        {
            var pose = BonePose.Zero;
            var dip = (Mathf.Cos(t * Mathf.PI * 2f) * -0.5f + 0.5f);
            var chew = Mathf.Sin(t * Mathf.PI * 12f) * dip;

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, -dip * 0.030f, dip * 0.018f);
                pose.rotation = new Vector3(dip * 7f, 0f, 0f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(dip * 26f + chew * 3.5f, 0f, 0f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(0f, Mathf.Sin(t * Mathf.PI * 4f) * (5f + tail * 4f), 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                pose.rotation = new Vector3(dip * -5f, 0f, 0f);
            }

            return pose;
        }

        static BonePose Happy(string bone, float t)
        {
            var pose = BonePose.Zero;
            var hop = Mathf.Abs(Mathf.Sin(t * Mathf.PI * 2f));
            var wag = Mathf.Sin(t * Mathf.PI * 10f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, hop * 0.048f, 0f);
                pose.rotation = new Vector3(-hop * 8f, 0f, Mathf.Sin(t * Mathf.PI * 4f) * 3f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(-hop * 10f, wag * 3f, 0f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(hop * 8f, wag * (12f + tail * 9f), 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                var front = bone is CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR;
                pose.rotation = new Vector3(front ? -hop * 24f : hop * 14f, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3(hop * 12f, 0f, 0f);
            }

            return pose;
        }

        static BonePose CaptureReaction(string bone, float t)
        {
            var pose = BonePose.Zero;
            var recoil = Bell(t, 0.22f, 0.26f);
            var shake = Mathf.Sin(t * 30f) * Mathf.Exp(-t * 2.4f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(shake * 0.012f, recoil * 0.026f, -recoil * 0.085f);
                pose.rotation = new Vector3(-recoil * 14f, shake * 5f, 0f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3(-recoil * 18f, shake * 11f, 0f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3(recoil * 10f, shake * (8f + tail * 6f), 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                var front = bone is CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR;
                pose.rotation = new Vector3(front ? -recoil * 26f : recoil * 12f, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3(recoil * 16f, 0f, 0f);
            }

            return pose;
        }

        static BonePose Spawn(string bone, float t)
        {
            var pose = BonePose.Zero;
            var rise = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01(t / 0.6f));
            var shake = Bell(t, 0.78f, 0.22f);

            if (bone == CreatureSockets.Body)
            {
                pose.position = new Vector3(0f, (rise - 1f) * 0.42f, 0f);
                pose.rotation = new Vector3((1f - rise) * -12f + shake * 6f, 0f, shake * Mathf.Sin(t * 40f) * 4f);
                return pose;
            }

            if (bone == CreatureSockets.Head)
            {
                pose.rotation = new Vector3((1f - rise) * 16f - shake * 9f, shake * Mathf.Sin(t * 34f) * 8f, 0f);
                return pose;
            }

            var tail = TailIndex(bone);
            if (tail >= 0f)
            {
                pose.rotation = new Vector3((1f - rise) * 12f, shake * Mathf.Sin(t * 26f) * (8f + tail * 6f), 0f);
                return pose;
            }

            if (IsLimb(bone))
            {
                pose.rotation = new Vector3((1f - rise) * 30f, 0f, 0f);
                return pose;
            }

            if (IsFoot(bone))
            {
                pose.rotation = new Vector3((1f - rise) * -18f, 0f, 0f);
            }

            return pose;
        }
    }
}
