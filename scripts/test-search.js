/**
 * Test script for search functionality
 */
const searchService = require('../services/searchService').default;

async function testSearch() {
  console.log('Starting search functionality test...');
  console.log('=================================================');

  // Test search with different queries
  await testSearchQuery('basketball');
  await testSearchQuery('NFL');
  await testSearchQuery('Golden State Warriors');
  await testSearchQuery('LeBron James');

  // Test search with filters
  await testSearchWithFilters('basketball', { contentTypes: ['news'] });
  await testSearchWithFilters('NFL', { contentTypes: ['teams'] });
  await testSearchWithFilters('playoffs', { sports: ['NBA'] });

  console.log('=================================================');
  console.log('All search tests completed!');
}

async function testSearchQuery(query) {
  console.log(`\nSearching for "${query}"...`);
  try {
    const results = await searchService.search(query);
    console.log(`Found ${results.totalResults} results:`);
    console.log(`- ${results.news.length} news items`);
    console.log(`- ${results.teams.length} teams`);
    console.log(`- ${results.players.length} players`);
    console.log(`- ${results.odds.length} odds`);

    // Display sample results if available
    if (results.news.length > 0) {
      console.log('\nSample news result:');
      console.log(results.news[0]);
    }

    if (results.teams.length > 0) {
      console.log('\nSample team result:');
      console.log(results.teams[0]);
    }

    if (results.players.length > 0) {
      console.log('\nSample player result:');
      console.log(results.players[0]);
    }

    if (results.odds.length > 0) {
      console.log('\nSample odds result:');
      console.log(results.odds[0]);
    }
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
  }
}

async function testSearchWithFilters(query, filters) {
  console.log(`\nSearching for "${query}" with filters:`, filters);
  try {
    const results = await searchService.search(query, filters);
    console.log(`Found ${results.totalResults} results with filters`);

    // Display filtered results counts
    console.log(`- ${results.news.length} news items`);
    console.log(`- ${results.teams.length} teams`);
    console.log(`- ${results.players.length} players`);
    console.log(`- ${results.odds.length} odds`);
  } catch (error) {
    console.error(`Error searching for "${query}" with filters:`, error);
  }
}

// Run the test
testSearch().catch(console.error);
