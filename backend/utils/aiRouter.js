const CATEGORIES = [
  "Police",
  "School/University",
  "Municipality",
  "Consumer/Cyber",
  "Human Rights",
  "Govt Dept",
  "Traffic",
  "Pollution"
];

const PATTERN_MATCHERS = [
  { category: "Police", regex: /\b(theft|robbery|assault|violence|harassment|threat|missing|crime|police|officer)\b/i },
  { category: "School/University", regex: /\b(school|college|university|teacher|student|exam|fees|hostel|campus)\b/i },
  { category: "Municipality", regex: /\b(garbage|trash|drain|sewage|streetlight|road|pothole|water|sanitation|street|sidewalk|sewer|drainage)\b/i },
  { category: "Consumer/Cyber", regex: /\b(fraud|scam|otp|bank|upi|cyber|hack|online|phishing|refund|payment|transaction|account)\b/i },
  { category: "Human Rights", regex: /\b(discrimination|abuse|custody|rights|violated|forced|child labor|harassment|bias)\b/i },
  { category: "Govt Dept", regex: /\b(pension|ration|aadhar|certificate|subsidy|office|bribe|corruption|scheme|application|permit)\b/i },
  { category: "Traffic", regex: /\b(traffic|signal|parking|accident|rash|helmet|speed|wrong side|congestion|roadblock|ticket|lane)\b/i },
  { category: "Pollution", regex: /\b(pollution|smoke|noise|dust|factory|waste|burning|air quality|chemical|emissions|toxic)\b/i }
];

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

async function routeCategory(description) {
  const text = normalizeText(description);
  if (!text) return "Municipality";

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({
          inputs: description,
          parameters: { candidate_labels: CATEGORIES },
        }),
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.labels && data.labels.length > 0) {
        const topLabel = data.labels[0];
        if (CATEGORIES.includes(topLabel)) {
          return topLabel;
        }
      }
    }
  } catch (error) {
    console.error("AI categorization failed, falling back to regex", error);
  }

  // Regex fallback
  for (const matcher of PATTERN_MATCHERS) {
    if (matcher.regex.test(text)) {
      return matcher.category;
    }
  }

  let bestCategory = "Municipality";
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    const words = PATTERN_MATCHERS.find((m) => m.category === cat)?.regex || /./;
    const score = (text.match(new RegExp(words.source, "gi")) || []).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory;
}

module.exports = { CATEGORIES, routeCategory };
