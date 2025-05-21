import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks';
import { useTheme } from '../contexts/ThemeContext';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';

// Define types for the component props and state
interface CategoryItem {
  id: string;
  name: string;
}

interface ArticleItem {
  id: string;
  title: string;
  description: string;
  image: any;
  readTime: string;
  category: string;
}

interface GlossaryItem {
  id: string;
  term: string;
  definition: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const KnowledgeEdgeScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories for the knowledge edge content
  const categories = [
    { id: 'all', name: t('knowledgeEdge.categories.all') },
    { id: 'guides', name: t('knowledgeEdge.categories.guides') },
    { id: 'glossary', name: t('knowledgeEdge.categories.glossary') },
    { id: 'strategies', name: t('knowledgeEdge.categories.strategies') },
    { id: 'faq', name: t('knowledgeEdge.categories.faq') },
  ];

  // Featured guides data
  const featuredGuides = [
    {
      id: 'market-inefficiencies',
      title: t('knowledgeEdge.articles.marketInefficiencies.title'),
      description: t('knowledgeEdge.articles.marketInefficiencies.description'),
      image: require('../assets/images/knowledge-edge/market-inefficiencies.png'),
      readTime: '8',
      category: 'strategies',
    },
    {
      id: 'live-betting',
      title: t('knowledgeEdge.articles.liveBetting.title'),
      description: t('knowledgeEdge.articles.liveBetting.description'),
      image: require('../assets/images/knowledge-edge/live-betting.png'),
      readTime: '7',
      category: 'strategies',
    },
  ];

  // Strategy articles data
  const strategyArticles = [
    {
      id: 'cognitive-biases',
      title: t('knowledgeEdge.articles.cognitiveBiases.title'),
      description: t('knowledgeEdge.articles.cognitiveBiases.description'),
      image: require('../assets/images/knowledge-edge/cognitive-biases.png'),
      readTime: '9',
      category: 'strategies',
    },
    {
      id: 'parlay-strategies',
      title: t('knowledgeEdge.articles.parlayStrategies.title'),
      description: t('knowledgeEdge.articles.parlayStrategies.description'),
      image: require('../assets/images/knowledge-edge/parlay-strategies.png'),
      readTime: '6',
      category: 'strategies',
    },
    {
      id: 'value-betting',
      title: t('knowledgeEdge.articles.valueBetting.title'),
      description: t('knowledgeEdge.articles.valueBetting.description'),
      image: require('../assets/images/knowledge-edge/value-betting.png'),
      readTime: '5',
      category: 'guides',
    },
    {
      id: 'advanced-concepts',
      title: t('knowledgeEdge.articles.advancedConcepts.title'),
      description: t('knowledgeEdge.articles.advancedConcepts.description'),
      image: require('../assets/images/knowledge-edge/advanced-concepts.png'),
      readTime: '10',
      category: 'guides',
    },
  ];

  // Glossary terms data
  const glossaryTerms = [
    {
      id: 'expected-value',
      term: t('knowledgeEdge.glossary.expectedValue.term'),
      definition: t('knowledgeEdge.glossary.expectedValue.definition'),
    },
    {
      id: 'closing-line-value',
      term: t('knowledgeEdge.glossary.closingLineValue.term'),
      definition: t('knowledgeEdge.glossary.closingLineValue.definition'),
    },
    {
      id: 'vigorish',
      term: t('knowledgeEdge.glossary.vigorish.term'),
      definition: t('knowledgeEdge.glossary.vigorish.definition'),
    },
    {
      id: 'arbitrage',
      term: t('knowledgeEdge.glossary.arbitrage.term'),
      definition: t('knowledgeEdge.glossary.arbitrage.definition'),
    },
    {
      id: 'regression',
      term: t('knowledgeEdge.glossary.regression.term'),
      definition: t('knowledgeEdge.glossary.regression.definition'),
    },
  ];

  // FAQ data
  const faqs = [
    {
      id: 'ai-probabilities',
      question: t('knowledgeEdge.faq.aiProbabilities.question'),
      answer: t('knowledgeEdge.faq.aiProbabilities.answer'),
    },
    {
      id: 'sharp-public',
      question: t('knowledgeEdge.faq.sharpPublic.question'),
      answer: t('knowledgeEdge.faq.sharpPublic.answer'),
    },
    {
      id: 'ml-updates',
      question: t('knowledgeEdge.faq.mlUpdates.question'),
      answer: t('knowledgeEdge.faq.mlUpdates.answer'),
    },
    {
      id: 'high-confidence',
      question: t('knowledgeEdge.faq.highConfidence.question'),
      answer: t('knowledgeEdge.faq.highConfidence.answer'),
    },
  ];

  const renderCategoryItem = ({ item }) => (
    <AccessibleTouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.selectedCategoryButton,
        {
          backgroundColor:
            selectedCategory === item.id ? colors.primaryAction : colors.surfaceBackground,
        },
      ]}
      onPress={() => setSelectedCategory(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityState={{ selected: selectedCategory === item.id }}
    >
      <AccessibleThemedText
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
          { color: selectedCategory === item.id ? colors.primaryBackground : colors.secondaryText },
        ]}
        type="small"
      >
        {item.name}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  );

  const renderFeaturedGuide = (item, index) => (
    <AccessibleTouchableOpacity
      key={item.id}
      style={[
        styles.featuredGuideCard,
        { backgroundColor: colors.primaryBackground, borderColor: colors.border },
      ]}
      onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={t('knowledgeEdge.accessibility.openArticle')}
    >
      <Image
        source={item.image}
        style={styles.featuredGuideImage}
        accessibilityLabel={t('knowledgeEdge.accessibility.articleImage')}
      />
      <AccessibleThemedView style={styles.featuredGuideContent}>
        <AccessibleThemedText style={styles.featuredGuideTitle} type="h3">
          {item.title}
        </AccessibleThemedText>
        <AccessibleThemedText style={styles.featuredGuideDescription} type="bodySmall">
          {item.description}
        </AccessibleThemedText>
        <AccessibleThemedView style={styles.featuredGuideFooter}>
          <AccessibleThemedText style={styles.readTime} type="small">
            {item.readTime} {t('knowledgeEdge.minRead')}
          </AccessibleThemedText>
          <AccessibleThemedView
            style={[styles.categoryTag, { backgroundColor: colors.primaryActionLight }]}
          >
            <AccessibleThemedText
              style={[styles.categoryTagText, { color: colors.primaryAction }]}
              type="small"
            >
              {t(`knowledgeEdge.categories.${item.category}`)}
            </AccessibleThemedText>
          </AccessibleThemedView>
        </AccessibleThemedView>
      </AccessibleThemedView>
    </AccessibleTouchableOpacity>
  );

  const renderStrategyArticle = (item, index) => (
    <AccessibleTouchableOpacity
      key={item.id}
      style={[
        styles.strategyArticleCard,
        { backgroundColor: colors.primaryBackground, borderColor: colors.border },
      ]}
      onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={t('knowledgeEdge.accessibility.openArticle')}
    >
      <AccessibleThemedView style={styles.strategyArticleContent}>
        <Image
          source={item.image}
          style={styles.strategyArticleImage}
          accessibilityLabel={t('knowledgeEdge.accessibility.articleImage')}
        />
        <AccessibleThemedView style={styles.strategyArticleTextContent}>
          <AccessibleThemedText style={styles.strategyArticleTitle} type="bodyStd">
            {item.title}
          </AccessibleThemedText>
          <AccessibleThemedText style={styles.strategyArticleDescription} type="bodySmall">
            {item.description}
          </AccessibleThemedText>
          <AccessibleThemedView style={styles.strategyArticleFooter}>
            <AccessibleThemedText style={styles.readTime} type="small">
              {item.readTime} {t('knowledgeEdge.minRead')}
            </AccessibleThemedText>
            <AccessibleThemedView
              style={[styles.categoryTag, { backgroundColor: colors.primaryActionLight }]}
            >
              <AccessibleThemedText
                style={[styles.categoryTagText, { color: colors.primaryAction }]}
                type="small"
              >
                {t(`knowledgeEdge.categories.${item.category}`)}
              </AccessibleThemedText>
            </AccessibleThemedView>
          </AccessibleThemedView>
        </AccessibleThemedView>
      </AccessibleThemedView>
    </AccessibleTouchableOpacity>
  );

  const renderGlossaryTerm = (item, index) => (
    <AccessibleTouchableOpacity
      key={item.id}
      style={[
        styles.glossaryItem,
        index < glossaryTerms.length - 1 && styles.glossaryItemBorder,
        { borderBottomColor: colors.border },
      ]}
      onPress={() => {}}
      accessibilityRole="button"
      accessibilityLabel={item.term}
      accessibilityHint={t('knowledgeEdge.accessibility.expandTerm')}
    >
      <AccessibleThemedView style={styles.glossaryItemHeader}>
        <AccessibleThemedText style={styles.glossaryTerm} type="bodyStd">
          {item.term}
        </AccessibleThemedText>
        <Ionicons name="chevron-down" size={16} color={colors.secondaryText} />
      </AccessibleThemedView>
      {index === 0 && (
        <AccessibleThemedText style={styles.glossaryDefinition} type="bodySmall">
          {item.definition}
        </AccessibleThemedText>
      )}
    </AccessibleTouchableOpacity>
  );

  const renderFaqItem = (item, index) => (
    <AccessibleTouchableOpacity
      key={item.id}
      style={[
        styles.faqItem,
        index < faqs.length - 1 && styles.faqItemBorder,
        { borderBottomColor: colors.border },
      ]}
      onPress={() => {}}
      accessibilityRole="button"
      accessibilityLabel={item.question}
      accessibilityHint={t('knowledgeEdge.accessibility.expandFaq')}
    >
      <AccessibleThemedView style={styles.faqItemHeader}>
        <AccessibleThemedText style={styles.faqQuestion} type="bodyStd">
          {item.question}
        </AccessibleThemedText>
        <Ionicons name="chevron-down" size={16} color={colors.secondaryText} />
      </AccessibleThemedView>
    </AccessibleTouchableOpacity>
  );

  return (
    <AccessibleThemedView style={styles.container}>
      {/* Header */}
      <AccessibleThemedView style={[styles.header, { backgroundColor: colors.primaryAction }]}>
        <AccessibleThemedText style={styles.headerTitle} type="h2">
          {t('knowledgeEdge.title')}
        </AccessibleThemedText>
        <AccessibleTouchableOpacity
          style={styles.searchButton}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel={t('knowledgeEdge.accessibility.search')}
        >
          <Ionicons name="search" size={24} color={colors.primaryBackground} />
        </AccessibleTouchableOpacity>
      </AccessibleThemedView>

      {/* Categories */}
      <AccessibleThemedView
        style={[
          styles.categoriesContainer,
          { backgroundColor: colors.primaryBackground, borderBottomColor: colors.border },
        ]}
      >
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </AccessibleThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Edge Assistant */}
        <AccessibleThemedView
          style={[
            styles.assistantContainer,
            { backgroundColor: colors.primaryBackground, borderBottomColor: colors.border },
          ]}
        >
          <AccessibleTouchableOpacity
            style={[styles.assistantCard, { backgroundColor: colors.primaryActionLight }]}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel={t('knowledgeEdge.assistant.title')}
            accessibilityHint={t('knowledgeEdge.accessibility.openAssistant')}
          >
            <AccessibleThemedView style={styles.assistantIconContainer}>
              <Ionicons name="chatbubble-ellipses" size={24} color={colors.primaryAction} />
            </AccessibleThemedView>
            <AccessibleThemedView style={styles.assistantContent}>
              <AccessibleThemedText style={styles.assistantTitle} type="bodyStd">
                {t('knowledgeEdge.assistant.title')}
              </AccessibleThemedText>
              <AccessibleThemedText style={styles.assistantDescription} type="bodySmall">
                {t('knowledgeEdge.assistant.description')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <AccessibleTouchableOpacity
              style={[styles.chatButton, { backgroundColor: colors.primaryAction }]}
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel={t('knowledgeEdge.assistant.chatButton')}
            >
              <AccessibleThemedText
                style={[styles.chatButtonText, { color: colors.primaryBackground }]}
                type="small"
              >
                {t('knowledgeEdge.assistant.chatButton')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        {/* Featured Guides */}
        <AccessibleThemedView style={styles.sectionContainer}>
          <AccessibleThemedText style={styles.sectionTitle} type="h3">
            {t('knowledgeEdge.sections.featuredGuides').toUpperCase()}
          </AccessibleThemedText>
          {featuredGuides.map(renderFeaturedGuide)}
        </AccessibleThemedView>

        {/* Glossary */}
        <AccessibleThemedView style={styles.sectionContainer}>
          <AccessibleThemedText style={styles.sectionTitle} type="h3">
            {t('knowledgeEdge.sections.glossary').toUpperCase()}
          </AccessibleThemedText>
          <AccessibleThemedView
            style={[
              styles.glossaryContainer,
              { backgroundColor: colors.primaryBackground, borderColor: colors.border },
            ]}
          >
            {glossaryTerms.map(renderGlossaryTerm)}
            <AccessibleTouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel={t('knowledgeEdge.viewFullGlossary')}
            >
              <AccessibleThemedText
                style={[styles.viewAllButtonText, { color: colors.primaryAction }]}
                type="small"
              >
                {t('knowledgeEdge.viewFullGlossary')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </AccessibleThemedView>
        </AccessibleThemedView>

        {/* Strategy Articles */}
        <AccessibleThemedView style={styles.sectionContainer}>
          <AccessibleThemedText style={styles.sectionTitle} type="h3">
            {t('knowledgeEdge.sections.strategyArticles').toUpperCase()}
          </AccessibleThemedText>
          {strategyArticles.map(renderStrategyArticle)}
          <AccessibleTouchableOpacity
            style={[styles.loadMoreButton, { borderColor: colors.primaryAction }]}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel={t('knowledgeEdge.loadMoreArticles')}
          >
            <AccessibleThemedText
              style={[styles.loadMoreButtonText, { color: colors.primaryAction }]}
              type="small"
            >
              {t('knowledgeEdge.loadMoreArticles')}
            </AccessibleThemedText>
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        {/* FAQ */}
        <AccessibleThemedView style={styles.sectionContainer}>
          <AccessibleThemedText style={styles.sectionTitle} type="h3">
            {t('knowledgeEdge.sections.faq').toUpperCase()}
          </AccessibleThemedText>
          <AccessibleThemedView
            style={[
              styles.faqContainer,
              { backgroundColor: colors.primaryBackground, borderColor: colors.border },
            ]}
          >
            {faqs.map(renderFaqItem)}
            <AccessibleTouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel={t('knowledgeEdge.viewAllFaqs')}
            >
              <AccessibleThemedText
                style={[styles.viewAllButtonText, { color: colors.primaryAction }]}
                type="small"
              >
                {t('knowledgeEdge.viewAllFaqs')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </AccessibleThemedView>
        </AccessibleThemedView>
      </ScrollView>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#007bff',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  assistantContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  assistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  assistantIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  assistantContent: {
    flex: 1,
    marginLeft: 12,
  },
  assistantTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assistantDescription: {
    fontSize: 12,
  },
  chatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featuredGuideCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  featuredGuideImage: {
    height: 160,
    width: '100%',
    backgroundColor: '#e0e0e0',
  },
  featuredGuideContent: {
    padding: 12,
  },
  featuredGuideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredGuideDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  featuredGuideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 12,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  glossaryContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glossaryItem: {
    padding: 12,
  },
  glossaryItemBorder: {
    borderBottomWidth: 1,
  },
  glossaryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glossaryTerm: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  glossaryDefinition: {
    fontSize: 12,
    marginTop: 8,
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  strategyArticleCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  strategyArticleContent: {
    flexDirection: 'row',
    padding: 12,
  },
  strategyArticleImage: {
    width: 64,
    height: 64,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  strategyArticleTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  strategyArticleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  strategyArticleDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  strategyArticleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadMoreButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  faqContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 12,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
  },
  faqItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
});

export default KnowledgeEdgeScreen;
