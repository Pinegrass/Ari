export function notificationAvailability(language: string, enabled: boolean | null): string {
  if (language === 'hi') return enabled === null
    ? 'अभी रोज़ के सुझावों की उपलब्धता जाँच नहीं सके। बिल रिमाइंडर अलग हैं।'
    : enabled
      ? 'रोज़ के सुझाव उपलब्ध हैं। आपके विकल्प, शांत समय और सीमा लागू होती है; हर बार सूचना मिलना तय नहीं है। बिल रिमाइंडर अलग हैं।'
      : 'रोज़ के तीन सुझाव अभी सक्रिय नहीं हैं। वैकल्पिक डिवाइस चेक-इन और बिल रिमाइंडर अलग हैं।';
  return enabled === null
    ? 'Daily check-in availability could not be confirmed. Bill reminders are separate.'
    : enabled
      ? 'Daily check-ins are available, subject to your choices, quiet hours and limits. Delivery is not guaranteed. Bill reminders are separate.'
      : 'The three daily check-ins are not active yet. Optional device check-ins and bill reminders are separate.';
}
