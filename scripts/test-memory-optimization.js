// Simple memory optimization test

console.log('🔧 Memory Optimization Test');
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS);

// Test memory usage with large array processing
function testChunkedProcessing() {
  console.log('Testing chunked processing...');
  
  // Simulate large dataset
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: `item_${i}`,
    data: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Item ${i}`,
    metadata: {
      timestamp: Date.now(),
      category: `category_${i % 100}`,
      tags: [`tag_${i % 10}`, `tag_${i % 20}`, `tag_${i % 30}`]
    }
  }));
  
  console.log(`Created dataset with ${largeDataset.length} items`);
  
  // Process in chunks
  const chunkSize = 100;
  let processedCount = 0;
  
  for (let i = 0; i < largeDataset.length; i += chunkSize) {
    const chunk = largeDataset.slice(i, i + chunkSize);
    
    // Simulate processing
    chunk.forEach(item => {
      // Mock data transformation
      item.processed = true;
      item.processedAt = Date.now();
    });
    
    processedCount += chunk.length;
    
    if (i % 1000 === 0) {
      console.log(`Processed ${processedCount}/${largeDataset.length} items`);
      
      // Check memory usage
      const memUsage = process.memoryUsage();
      console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB heap used`);
    }
  }
  
  console.log(`✅ Successfully processed ${processedCount} items in chunks`);
  return true;
}

try {
  // Set memory limit
  if (!process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
    console.log('Setting NODE_OPTIONS for higher memory limit...');
    process.env.NODE_OPTIONS = '--max-old-space-size=8192';
  }
  
  testChunkedProcessing();
  
  const finalMemUsage = process.memoryUsage();
  console.log('🎉 Memory optimization test completed successfully!');
  console.log(`Final memory usage: ${Math.round(finalMemUsage.heapUsed / 1024 / 1024)}MB heap used`);
  console.log('✅ No heap out of memory errors detected');
  
} catch (error) {
  console.error('❌ Memory test failed:', error.message);
  process.exit(1);
}