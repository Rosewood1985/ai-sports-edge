const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Generate AI summary for sports news
 * This function uses OpenAI's API to generate a summary of sports news
 * with a focus on betting implications
 */
exports.generateAISummary = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Validate required fields
  if (!data.content) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Content is required.'
    );
  }

  const content = data.content;
  const maxLength = data.maxLength || 150;
  const focusOn = data.focusOn || 'betting';

  try {
    // In a production environment, this would call the OpenAI API
    // For now, we'll generate a mock summary based on the content
    
    // This is how you would call the OpenAI API:
    // const response = await axios.post(
    //   'https://api.openai.com/v1/chat/completions',
    //   {
    //     model: 'gpt-4',
    //     messages: [
    //       {
    //         role: 'system',
    //         content: `You are a sports analyst specializing in summarizing sports news. Focus on how this might affect betting odds, point spreads, and game outcomes. Be concise and focus on facts.`
    //       },
    //       {
    //         role: 'user',
    //         content: `Summarize the following sports news in ${maxLength} words or less:\n\n${content}`
    //       }
    //     ],
    //     max_tokens: 300,
    //     temperature: 0.5
    //   },
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // );
    
    // const summary = response.data.choices[0].message.content.trim();
    
    // For now, generate a mock summary
    const summary = generateMockSummary(content, maxLength, focusOn);
    
    // Store the summary in Firestore for caching
    const db = admin.firestore();
    const summaryRef = db.collection('aiSummaries').doc();
    
    await summaryRef.set({
      content,
      summary,
      maxLength,
      focusOn,
      userId: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      summary,
      summaryId: summaryRef.id
    };
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Generate a mock summary based on the content
 * @param {string} content - Content to summarize
 * @param {number} maxLength - Maximum length of summary
 * @param {string} focusOn - Focus area for summary
 * @returns {string} - Generated summary
 */
function generateMockSummary(content, maxLength, focusOn) {
  const contentLower = content.toLowerCase();
  
  // Generate different summaries based on the content and focus
  if (contentLower.includes('injury')) {
    if (focusOn === 'betting') {
      return `This injury significantly impacts betting odds. Teams missing key players typically see point spreads shift by 2-4 points. Consider how this absence affects team dynamics before placing bets. Historical performance without this player suggests decreased offensive efficiency.`;
    } else if (focusOn === 'fantasy') {
      return `Fantasy impact: Consider benching this player immediately and monitor injury reports. Look for backup players who will see increased minutes/touches as potential waiver wire pickups. Expect reduced production even upon return.`;
    } else {
      return `Key player injury that will impact team performance in upcoming games. Recovery timeline suggests a multi-week absence. Team will need to adjust strategy and rotations accordingly.`;
    }
  } else if (contentLower.includes('lineup')) {
    if (focusOn === 'betting') {
      return `Lineup changes suggest value in the underdog for this matchup. New starters typically create defensive mismatches that can be exploited. Consider betting the over as defensive chemistry may be disrupted with new rotations.`;
    } else if (focusOn === 'fantasy') {
      return `Fantasy alert: New starters represent immediate waiver wire opportunities. Expect increased minutes and usage rates for promoted players. Monitor performance closely in first game with new role.`;
    } else {
      return `Strategic lineup adjustments that could impact team performance. New starters bring different skillsets that may change offensive and defensive approaches. Watch for chemistry issues in early stages.`;
    }
  } else if (contentLower.includes('trade')) {
    if (focusOn === 'betting') {
      return `This trade creates immediate betting opportunities. The receiving team typically sees a short-term boost in performance, suggesting value on money lines. Long-term implications may shift championship futures odds significantly.`;
    } else if (focusOn === 'fantasy') {
      return `Major fantasy implications from this trade. Player value often increases in new systems with different usage rates. Consider selling high on complementary players who may see reduced touches with new addition.`;
    } else {
      return `Significant trade that reshapes competitive landscape. Both teams addressing specific needs through this deal. Short-term adjustment period expected before full integration of new players.`;
    }
  } else {
    if (focusOn === 'betting') {
      return `This development has subtle betting implications that the market may not have fully priced in. Look for value in prop bets and alternative lines. Historical trends in similar situations suggest opportunity for informed bettors.`;
    } else if (focusOn === 'fantasy') {
      return `Fantasy managers should monitor this situation closely. Potential for significant shifts in player values and roles. Consider proactive roster moves to capitalize on information before it's widely recognized.`;
    } else {
      return `Important development that could impact future games and strategies. Teams will need to adapt to these changes. Fans should watch for ripple effects throughout the league.`;
    }
  }
}

// Export the functions
module.exports = {
  generateAISummary: exports.generateAISummary
};