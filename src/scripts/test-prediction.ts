import { dataIngestionService, modelPipelineConnector } from '../api';

(async () => {
  const gameId = '401584712'; // Replace with a real ESPN NBA or NFL game ID
  const sport = 'NBA';        // Change to 'NFL' if testing football predictions

  try {
    console.log(`\n🧠 Ingesting data for game ${gameId} (${sport})...`);
    const factors = sport === 'NBA'
      ? await dataIngestionService.getNBAGamePredictionFactors(gameId, true)
      : await dataIngestionService.getNFLGamePredictionFactors(gameId, true);

    console.log('\n📊 Prediction factors:', JSON.stringify(factors, null, 2));

    console.log('\n🤖 Sending to model...');
    const prediction = await modelPipelineConnector.getPrediction(gameId, sport);

    console.log('\n✅ Model prediction result:');
    console.log(JSON.stringify(prediction, null, 2));
  } catch (err) {
    console.error('\n❌ Prediction pipeline failed:', err.message);
  }
})();
