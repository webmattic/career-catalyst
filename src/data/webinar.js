export const webinarConfig = {
  paymentMode: 'upi_qr',
  amountInPaise: 9900,
  currency: 'INR',
  displayPrice: '₹99',
  feeLabel: '₹99',
  dateLabel: 'Saturday, 29 August 2026',
  timeLabel: '4:00 PM IST',
  durationLabel: '75 minutes + parent Q&A',
  platformLabel: 'Google Meet',
  audienceLabel: 'Parents of Class 8, 9 and 10 students',
  locationLabel: 'Mumbai parents and school context',
  preferredBatchLabel: 'Saturday, 29 August 2026 • 4:00 PM IST',
  sessionStartIso: '2026-08-29T16:00:00+05:30',
  reminder24WindowMinutes: 20,
  reminder1WindowMinutes: 20,
  registrationSource: 'pragnya-webinar-landing-page',
};

export const upiPaymentConfig = {
  amount: '₹99',
  amountNumeric: 99,
  upiId: 'REPLACE_WITH_FINAL_UPI_ID',
  payeeName: 'Pragnya Consultancy',
  purpose: 'Pragnya Stream Clarity Webinar',
  webinarDateTime: webinarConfig.preferredBatchLabel,
  // UPI QR Code for payment
  qrImagePath: '/images/Mehal-QRCode.webp',
  qrReady: true,
};

export const biggestConcernOptions = [
  'Science vs Commerce vs Arts confusion',
  'Child is good at studies but lacks direction',
  'Parent and child disagree on career choice',
  'Too many career options and no clarity',
  'Need aptitude-based guidance',
];

export const webinarFaqs = [
  {
    question: 'Who is this webinar for?',
    answer:
      'This webinar is for parents of Class 8, 9 and 10 students who are confused about stream selection, subject fit, career direction or how to guide their child before Class 10 pressure increases.',
  },
  {
    question: 'Is this a full aptitude test?',
    answer:
      'No. The webinar is a practical parent guidance session. It will help you understand how aptitude, personality, interests and study style should be considered before choosing a stream. Parents who want deeper clarity can choose an optional assessment pathway after the webinar.',
  },
  {
    question: 'Will my child get a final career recommendation in the webinar?',
    answer:
      'No single webinar can responsibly give a final career recommendation for every child. The session will help parents understand the right decision framework and identify whether a deeper assessment is needed.',
  },
  {
    question: 'How will I receive the webinar link?',
    answer:
      'After completing your ₹99 registration, the webinar confirmation and joining details will be sent to your WhatsApp number.',
  },
  {
    question: 'Can both parent and child attend?',
    answer:
      'Yes. Parents can attend alone, but it is useful if the child is also available for part of the discussion.',
  },
  {
    question: 'What happens after the webinar?',
    answer:
      'You can stop at the webinar itself. Parents who want deeper clarity can choose an optional scientific assessment and personal counselling pathway after the session.',
  },
];
