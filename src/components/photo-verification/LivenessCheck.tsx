// src/components/photo-verification/LivenessCheck.tsx

"use client";

/**
 * Selfie vivant (AWS Rekognition Face Liveness).
 * Chargé uniquement côté navigateur (import dynamique, ssr: false) :
 * le composant utilise la caméra et TensorFlow.js.
 *
 * Les identifiants AWS reçus sont temporaires (15 min) et limités au
 * démarrage de CETTE session de vérification.
 */

import "@aws-amplify/ui-react/styles.css";

import { ThemeProvider } from "@aws-amplify/ui-react";
import { FaceLivenessDetectorCore } from "@aws-amplify/ui-react-liveness";

export type LivenessCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string | null;
};

const DISPLAY_TEXT = {
  // Écran d'accueil
  startScreenBeginCheckText: "Commencer le selfie",
  goodFitCaptionText: "Bon cadrage",
  goodFitAltText: "Visage bien placé dans l’ovale",
  tooFarCaptionText: "Trop loin",
  tooFarAltText: "Visage trop éloigné de l’écran",
  photosensitivityWarningHeadingText: "Avertissement de photosensibilité",
  photosensitivityWarningBodyText: "La vérification affiche des lumières de couleurs qui clignotent. Soyez prudente si vous êtes photosensible.",
  photosensitivityWarningInfoText:
    "Un faible pourcentage de personnes peuvent faire une crise d’épilepsie face à certaines lumières colorées. Soyez prudente si vous ou un proche êtes concernés.",
  photosensitivityWarningLabelText: "Plus d’informations sur la photosensibilité",
  // Consignes
  hintMoveFaceFrontOfCameraText: "Placez votre visage face à la caméra",
  hintTooManyFacesText: "Un seul visage doit apparaître",
  hintFaceDetectedText: "Visage détecté",
  hintCanNotIdentifyText: "Placez votre visage face à la caméra",
  hintTooCloseText: "Reculez un peu",
  hintTooFarText: "Rapprochez-vous",
  hintConnectingText: "Connexion…",
  hintVerifyingText: "Vérification…",
  hintCheckCompleteText: "Vérification terminée",
  hintIlluminationTooBrightText: "Allez dans un endroit moins lumineux",
  hintIlluminationTooDarkText: "Allez dans un endroit plus lumineux",
  hintIlluminationNormalText: "Éclairage correct",
  hintHoldFaceForFreshnessText: "Ne bougez plus",
  hintCenterFaceText: "Centrez votre visage",
  hintCenterFaceInstructionText: "Placez votre visage dans l’ovale",
  hintFaceOffCenterText: "Votre visage n’est pas centré",
  hintMatchIndicatorText: "50 % terminé. Continuez à vous rapprocher.",
  // Caméra
  cameraMinSpecificationsHeadingText: "La caméra ne répond pas aux exigences minimales",
  cameraMinSpecificationsMessageText: "La caméra doit filmer au moins en 320 × 240 à 15 images par seconde.",
  cameraNotFoundHeadingText: "Caméra inaccessible",
  cameraNotFoundMessageText: "Vérifiez qu’une caméra est branchée et qu’aucune autre application ne l’utilise. Autorisez ensuite l’accès à la caméra dans votre navigateur.",
  retryCameraPermissionsText: "Réessayer",
  waitingCameraPermissionText: "En attente de votre autorisation d’accès à la caméra.",
  a11yVideoLabelText: "Image de votre caméra pour la vérification",
  // Pendant l'enregistrement
  recordingIndicatorText: "Enr.",
  cancelLivenessCheckText: "Annuler",
  // Erreurs
  errorLabelText: "Erreur",
  connectionTimeoutHeaderText: "Délai de connexion dépassé",
  connectionTimeoutMessageText: "La connexion a pris trop de temps.",
  timeoutHeaderText: "Temps écoulé",
  timeoutMessageText: "Votre visage n’est pas resté dans l’ovale assez longtemps. Gardez-le bien centré.",
  faceDistanceHeaderText: "Mouvement vers l’avant détecté",
  faceDistanceMessageText: "Évitez de vous rapprocher en vous connectant.",
  multipleFacesHeaderText: "Plusieurs visages détectés",
  multipleFacesMessageText: "Un seul visage doit apparaître devant la caméra.",
  clientHeaderText: "Erreur",
  clientMessageText: "La vérification a échoué à cause d’un problème technique.",
  serverHeaderText: "Problème serveur",
  serverMessageText: "Impossible de terminer la vérification à cause d’un problème de serveur.",
  landscapeHeaderText: "Orientation paysage non prise en charge",
  landscapeMessageText: "Tournez votre appareil en mode portrait.",
  portraitMessageText: "Gardez votre appareil en mode portrait pendant la vérification.",
  tryAgainText: "Réessayer",
};

export default function LivenessCheck({
  sessionId,
  region,
  credentials,
  onComplete,
  onCancel,
  onError,
}: {
  sessionId: string;
  region: string;
  credentials: LivenessCredentials;
  onComplete: () => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  return (
    <ThemeProvider colorMode="light">
      <div className="overflow-hidden rounded-3xl bg-white text-[#1b0d38]">
        <FaceLivenessDetectorCore
          sessionId={sessionId}
          region={region}
          onAnalysisComplete={async () => onComplete()}
          onUserCancel={onCancel}
          onError={(err) => {
            console.error("Liveness :", err);
            onError(
              err?.state === "CAMERA_ACCESS_ERROR" || err?.state === "CAMERA_FRAMERATE_ERROR"
                ? "Impossible d’utiliser la caméra. Autorisez l’accès à la caméra dans votre navigateur, puis réessayez."
                : "Le selfie n’a pas pu aboutir. Réessayez dans un endroit bien éclairé, visage centré dans l’ovale."
            );
          }}
          config={{
            credentialProvider: async () => ({
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              sessionToken: credentials.sessionToken,
              expiration: credentials.expiration ? new Date(credentials.expiration) : undefined,
            }),
          }}
          displayText={DISPLAY_TEXT}
        />
      </div>
    </ThemeProvider>
  );
}
