/**
 * Privacy Policy Configuration
 * Versioned consent terms with historical tracking
 */

export const PRIVACY_POLICIES = [
  {
    version: '1.0',
    date: '2026-03-01',
    title: 'Privacy Policy v1.0',
    sections: [
      {
        id: 'data-collection',
        title: 'Data Collection',
        content: `Krumm collects cognitive assessment data including:
        - Game performance metrics (scores, reaction times, accuracy)
        - Behavioral telemetry (cursor movement, response patterns)
        - Video and audio from your camera (if you consent)
        
All biometric data is encrypted locally on your device before transmission.`
      },
      {
        id: 'encryption',
        title: 'Data Encryption & Privacy',
        content: `Your sensitive data (video, biometrics) is:
        1. Processed locally on your device using military-grade encryption (ChaCha20-Poly1305)
        2. Encrypted before any transmission to our servers
        3. Stored encrypted with no key on server (edge computing architecture)
        
Your assessment results are available only to authorized recruiters and remain confidential.`
      },
      {
        id: 'data-usage',
        title: 'How We Use Your Data',
        content: `Assessment data is used exclusively for:
        - Evaluating cognitive capabilities for the assessment
        - Generating personalized talent insights
        - Aggregated research (never individual-level sharing)
        
We will never:
        - Sell your data to third parties
        - Use your video/audio outside assessment context
        - Share unencrypted biometric data`
      },
      {
        id: 'your-rights',
        title: 'Your Rights',
        content: `Under GDPR, CCPA, and equivalent laws, you have the right to:
        - Access all your assessment data
        - Request deletion of your data
        - Opt out of biometric collection (assessment may be limited)
        - Withdraw consent at any time
        
Contact us at privacy@krumm.app for data requests.`
      }
    ],
    consents: [
      {
        id: 'cognitive-assessment',
        title: 'Cognitive Assessment Data',
        description: 'Game scores, accuracy, response times (required for assessment)',
        required: true,
        dataTypes: ['scores', 'reaction_times', 'accuracy_metrics']
      },
      {
        id: 'cursor-telemetry',
        title: 'Cursor & Interaction Telemetry',
        description: 'Movement patterns and interaction data (optional, improves insights)',
        required: false,
        dataTypes: ['cursor_position', 'velocity', 'click_patterns']
      },
      {
        id: 'webcam-biometric',
        title: 'Webcam & Facial Expressions',
        description: 'Video for engagement & attention metrics (optional)',
        required: false,
        dataTypes: ['video_frames', 'blink_rate', 'head_pose']
      },
      {
        id: 'audio-engagement',
        title: 'Audio & Engagement Signals',
        description: 'Sound for stress/engagement detection (optional)',
        required: false,
        dataTypes: ['audio_waveform', 'speech_rate', 'pauses']
      }
    ]
  }
];

export const getCurrentPolicy = () => {
  return PRIVACY_POLICIES[PRIVACY_POLICIES.length - 1];
};

export const getPolicyByVersion = (version) => {
  return PRIVACY_POLICIES.find((p) => p.version === version);
};

export default {
  PRIVACY_POLICIES,
  getCurrentPolicy,
  getPolicyByVersion
};
