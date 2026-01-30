// legal chatbot screen - shows nepal legal rights info as a chat
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Legal Topics for Nepal
const LEGAL_TOPICS = [
  {
    id: 'domestic_violence',
    title: 'घरेलु हिंसा',
    subtitle: 'Domestic Violence',
    icon: 'home',
    color: '#F06292',
  },
  {
    id: 'workplace_harassment',
    title: 'कार्यस्थलमा उत्पीडन',
    subtitle: 'Workplace Harassment',
    icon: 'business',
    color: '#F06292',
  },
  {
    id: 'property_rights',
    title: 'सम्पत्ति अधिकार',
    subtitle: 'Property Rights',
    icon: 'home-outline',
    color: '#F06292',
  },
  {
    id: 'marriage_divorce',
    title: 'विवाह र सम्बन्ध विच्छेद',
    subtitle: 'Marriage & Divorce',
    icon: 'heart-circle',
    color: '#F06292',
  },
  {
    id: 'sexual_harassment',
    title: 'यौन उत्पीडन',
    subtitle: 'Sexual Harassment',
    icon: 'alert-circle',
    color: '#F06292',
  },
  {
    id: 'citizenship',
    title: 'नागरिकता अधिकार',
    subtitle: 'Citizenship Rights',
    icon: 'card',
    color: '#F06292',
  },
  {
    id: 'education_rights',
    title: 'शिक्षा अधिकार',
    subtitle: 'Education Rights',
    icon: 'school',
    color: '#F06292',
  },
  {
    id: 'health_rights',
    title: 'स्वास्थ्य अधिकार',
    subtitle: 'Health Rights',
    icon: 'medical',
    color: '#F06292',
  },
];

// nepal legal info database
const LEGAL_INFO: any = {
  domestic_violence: {
    title: 'Domestic Violence Laws',
    titleNepali: 'घरेलु हिंसा सम्बन्धी कानून',
    laws: [
      {
        act: 'Domestic Violence (Offence and Punishment) Act, 2066 (2009)',
        actNepali: 'घरेलु हिंसा (अपराध तथा सजाय) ऐन, २०६६',
        description: 'This act prohibits any form of physical, mental, sexual, or economic violence within the family.',
        descriptionNepali: 'यो ऐनले परिवार भित्र कुनै पनि प्रकारको शारीरिक, मानसिक, यौन वा आर्थिक हिंसालाई निषेध गर्दछ।',
      },
    ],
    rights: [
      'Right to live without violence',
      'Right to file complaint at local police station',
      'Right to protection order from court',
      'Right to temporary shelter',
      'Right to legal aid and counseling',
    ],
    rightsNepali: [
      'हिंसा बिना बाँच्ने अधिकार',
      'स्थानीय प्रहरी कार्यालयमा उजुरी दिने अधिकार',
      'अदालतबाट सुरक्षा आदेश पाउने अधिकार',
      'अस्थायी आश्रय पाउने अधिकार',
      'कानुनी सहायता र परामर्श पाउने अधिकार',
    ],
    actions: [
      'Call National Women Commission: 1145',
      'Visit nearest police station',
      'Contact Women and Children Service Center',
      'Seek help from local women\'s organization',
      'Document evidence (photos, medical reports)',
    ],
    actionsNepali: [
      'राष्ट्रिय महिला आयोगमा फोन गर्नुहोस्: ११४५',
      'नजिकको प्रहरी कार्यालयमा जानुहोस्',
      'महिला तथा बालबालिका सेवा केन्द्रमा सम्पर्क गर्नुहोस्',
      'स्थानीय महिला संगठनबाट सहायता लिनुहोस्',
      'प्रमाण संकलन गर्नुहोस् (फोटो, चिकित्सा रिपोर्ट)',
    ],
    contacts: [
      { name: 'National Women Commission', phone: '1145' },
      { name: 'Women Helpline', phone: '1660-01-19851' },
      { name: 'Police Emergency', phone: '100' },
    ],
  },
  workplace_harassment: {
    title: 'Workplace Harassment Rights',
    titleNepali: 'कार्यस्थल उत्पीडन अधिकार',
    laws: [
      {
        act: 'Labour Act, 2074 (2017)',
        actNepali: 'श्रम ऐन, २०७४',
        description: 'Prohibits sexual harassment in the workplace and mandates complaint mechanisms.',
        descriptionNepali: 'कार्यस्थलमा यौन उत्पीडन निषेध गर्दछ र उजुरी संयन्त्र अनिवार्य गर्दछ।',
      },
      {
        act: 'Sexual Harassment at Workplace (Prevention) Act, 2071',
        actNepali: 'कार्यस्थलमा यौन दुर्व्यवहार निवारण ऐन, २०७१',
        description: 'Provides protection against sexual harassment at workplace.',
        descriptionNepali: 'कार्यस्थलमा यौन उत्पीडन विरुद्ध संरक्षण प्रदान गर्दछ।',
      },
    ],
    rights: [
      'Right to work in safe environment',
      'Right to file complaint with employer',
      'Right to confidential investigation',
      'Right to legal action if not addressed',
      'Right to compensation for damages',
    ],
    rightsNepali: [
      'सुरक्षित वातावरणमा काम गर्ने अधिकार',
      'रोजगारदातासँग उजुरी दिने अधिकार',
      'गोप्य अनुसन्धान पाउने अधिकार',
      'समाधान नभएमा कानुनी कारबाही गर्ने अधिकार',
      'क्षतिपूर्ति पाउने अधिकार',
    ],
    actions: [
      'Report to your supervisor or HR department',
      'File written complaint with details',
      'Contact Labour Office',
      'Seek help from trade union',
      'Document all incidents with dates and witnesses',
    ],
    actionsNepali: [
      'आफ्नो पर्यवेक्षक वा एचआर विभागमा रिपोर्ट गर्नुहोस्',
      'विवरण सहित लिखित उजुरी दर्ता गर्नुहोस्',
      'श्रम कार्यालयमा सम्पर्क गर्नुहोस्',
      'ट्रेड युनियनबाट सहायता लिनुहोस्',
      'मिति र साक्षीहरू सहित सबै घटनाहरू दस्तावेज गर्नुहोस्',
    ],
    contacts: [
      { name: 'Labour Department', phone: '01-4211490' },
      { name: 'Women Commission', phone: '1145' },
    ],
  },
  property_rights: {
    title: 'Property Rights',
    titleNepali: 'सम्पत्ति अधिकार',
    laws: [
      {
        act: 'National Civil Code, 2074 (2017)',
        actNepali: 'नेपालको नागरिक संहिता, २०७४',
        description: 'Ensures equal property rights for sons and daughters.',
        descriptionNepali: 'छोरा र छोरीलाई समान सम्पत्ति अधिकार सुनिश्चित गर्दछ।',
      },
    ],
    rights: [
      'Equal right to ancestral property',
      'Right to property from parents',
      'Right to property after marriage',
      'Right to register property in own name',
      'Right to sell or transfer property',
    ],
    rightsNepali: [
      'पुर्खौली सम्पत्तिमा समान अधिकार',
      'आमाबाबुको सम्पत्तिमा अधिकार',
      'विवाहपछि सम्पत्तिमा अधिकार',
      'आफ्नो नाममा सम्पत्ति दर्ता गर्ने अधिकार',
      'सम्पत्ति बेच्ने वा हस्तान्तरण गर्ने अधिकार',
    ],
    actions: [
      'Consult lawyer for property division',
      'Visit Land Revenue Office for registration',
      'Collect necessary documents (citizenship, birth certificate)',
      'File case in court if rights denied',
      'Contact Women Legal Aid organization',
    ],
    actionsNepali: [
      'सम्पत्ति विभाजनको लागि वकिलसँग परामर्श लिनुहोस्',
      'दर्ताको लागि मालपोत कार्यालय जानुहोस्',
      'आवश्यक कागजातहरू संकलन गर्नुहोस् (नागरिकता, जन्म प्रमाणपत्र)',
      'अधिकार अस्वीकार भएमा अदालतमा मुद्दा दायर गर्नुहोस्',
      'महिला कानुनी सहायता संगठनमा सम्पर्क गर्नुहोस्',
    ],
    contacts: [
      { name: 'Land Revenue Office', phone: '01-4200000' },
      { name: 'Nepal Bar Association', phone: '01-4262004' },
    ],
  },
  marriage_divorce: {
    title: 'Marriage & Divorce Rights',
    titleNepali: 'विवाह र सम्बन्ध विच्छेद अधिकार',
    laws: [
      {
        act: 'National Civil Code, 2074 (2017)',
        actNepali: 'नेपालको नागरिक संहिता, २०७४',
        description: 'Regulates marriage and divorce proceedings, ensuring equal rights.',
        descriptionNepali: 'विवाह र सम्बन्ध विच्छेद प्रक्रिया नियमित गर्दछ, समान अधिकार सुनिश्चित गर्दछ।',
      },
    ],
    rights: [
      'Right to marry with consent (minimum age 20)',
      'Right to file for divorce',
      'Right to alimony and child support',
      'Right to share of marital property',
      'Right to custody of children',
    ],
    rightsNepali: [
      'सहमति संग विवाह गर्ने अधिकार (न्यूनतम उमेर २० वर्ष)',
      'सम्बन्ध विच्छेदको लागि निवेदन दिने अधिकार',
      'भरणपोषण र बाल समर्थन पाउने अधिकार',
      'वैवाहिक सम्पत्तिको हिस्सा पाउने अधिकार',
      'बच्चाको हेरचाह पाउने अधिकार',
    ],
    actions: [
      'Consult family lawyer',
      'File petition in District Court',
      'Gather marriage certificate and documents',
      'Attend mediation sessions if required',
      'Seek counseling support',
    ],
    actionsNepali: [
      'पारिवारिक वकिलसँग परामर्श लिनुहोस्',
      'जिल्ला अदालतमा निवेदन दिनुहोस्',
      'विवाह प्रमाणपत्र र कागजातहरू संकलन गर्नुहोस्',
      'आवश्यक भएमा मध्यस्थता सत्रमा उपस्थित हुनुहोस्',
      'परामर्श सहायता लिनुहोस्',
    ],
    contacts: [
      { name: 'District Court', phone: '01-4200000' },
      { name: 'Family Court', phone: '01-4262626' },
    ],
  },
  sexual_harassment: {
    title: 'Sexual Harassment Laws',
    titleNepali: 'यौन उत्पीडन कानून',
    laws: [
      {
        act: 'National Criminal Code, 2074 (2017)',
        actNepali: 'नेपालको फौजदारी संहिता, २०७४',
        description: 'Criminalizes rape, sexual assault, and harassment with strict penalties.',
        descriptionNepali: 'बलात्कार, यौन दुव्र्यवहार र उत्पीडनलाई कठोर सजाय सहित अपराधीकरण गर्दछ।',
      },
    ],
    rights: [
      'Right to file FIR at any police station',
      'Right to medical examination',
      'Right to privacy during investigation',
      'Right to legal representation',
      'Right to compensation from perpetrator',
    ],
    rightsNepali: [
      'कुनै पनि प्रहरी कार्यालयमा एफआईआर दर्ता गर्ने अधिकार',
      'चिकित्सा परीक्षण पाउने अधिकार',
      'अनुसन्धानको समयमा गोपनीयता पाउने अधिकार',
      'कानुनी प्रतिनिधित्व पाउने अधिकार',
      'अपराधीबाट क्षतिपूर्ति पाउने अधिकार',
    ],
    actions: [
      'Immediately call 100 (Police)',
      'Go to nearest police station to file FIR',
      'Get medical examination done',
      'Preserve evidence (clothes, photos)',
      'Contact victim support organizations',
    ],
    actionsNepali: [
      'तुरुन्त १०० (प्रहरी) मा फोन गर्नुहोस्',
      'एफआईआर दर्ता गर्न नजिकको प्रहरी कार्यालय जानुहोस्',
      'चिकित्सा परीक्षण गराउनुहोस्',
      'प्रमाण सुरक्षित राख्नुहोस् (लुगा, फोटो)',
      'पीडित सहायता संगठनमा सम्पर्क गर्नुहोस्',
    ],
    contacts: [
      { name: 'Police Emergency', phone: '100' },
      { name: 'Women & Children Service Center', phone: '1145' },
      { name: 'WOREC Nepal', phone: '01-4278569' },
    ],
  },
  citizenship: {
    title: 'Citizenship Rights',
    titleNepali: 'नागरिकता अधिकार',
    laws: [
      {
        act: 'Constitution of Nepal, 2072 (2015)',
        actNepali: 'नेपालको संविधान, २०७२',
        description: 'Ensures equal citizenship rights to both men and women.',
        descriptionNepali: 'पुरुष र महिला दुवैलाई समान नागरिकता अधिकार सुनिश्चित गर्दछ।',
      },
    ],
    rights: [
      'Right to citizenship by descent',
      'Right to pass citizenship to children',
      'Right to citizenship certificate',
      'Equal rights as male citizens',
      'Right to retain citizenship after marriage',
    ],
    rightsNepali: [
      'वंशजको आधारमा नागरिकता पाउने अधिकार',
      'बच्चाहरूलाई नागरिकता दिने अधिकार',
      'नागरिकता प्रमाणपत्र पाउने अधिकार',
      'पुरुष नागरिकहरू जस्तै समान अधिकार',
      'विवाह पछि नागरिकता कायम राख्ने अधिकार',
    ],
    actions: [
      'Apply at District Administration Office',
      'Submit required documents (birth certificate, parents\' citizenship)',
      'Fill citizenship application form',
      'Provide witness if needed',
      'Collect citizenship certificate after verification',
    ],
    actionsNepali: [
      'जिल्ला प्रशासन कार्यालयमा आवेदन दिनुहोस्',
      'आवश्यक कागजातहरू पेश गर्नुहोस् (जन्म प्रमाणपत्र, आमाबाबुको नागरिकता)',
      'नागरिकता आवेदन फारम भर्नुहोस्',
      'आवश्यक भएमा साक्षी उपलब्ध गराउनुहोस्',
      'प्रमाणीकरण पछि नागरिकता प्रमाणपत्र संकलन गर्नुहोस्',
    ],
    contacts: [
      { name: 'District Administration Office', phone: '01-4200000' },
    ],
  },
  education_rights: {
    title: 'Education Rights',
    titleNepali: 'शिक्षा अधिकार',
    laws: [
      {
        act: 'Right to Education Act, 2075 (2018)',
        actNepali: 'शिक्षाको हक सम्बन्धी ऐन, २०७५',
        description: 'Ensures free and compulsory basic education for all children.',
        descriptionNepali: 'सबै बच्चाहरूका लागि नि:शुल्क र अनिवार्य आधारभूत शिक्षा सुनिश्चित गर्दछ।',
      },
    ],
    rights: [
      'Right to free basic education',
      'Right to study without discrimination',
      'Right to scholarship and support',
      'Right to safe learning environment',
      'Right to continue education after marriage',
    ],
    rightsNepali: [
      'नि:शुल्क आधारभूत शिक्षाको अधिकार',
      'भेदभाव बिना अध्ययन गर्ने अधिकार',
      'छात्रवृत्ति र सहयोग पाउने अधिकार',
      'सुरक्षित शिक्षा वातावरणको अधिकार',
      'विवाह पछि शिक्षा जारी राख्ने अधिकार',
    ],
    actions: [
      'Contact school/college administration',
      'Apply for scholarships and grants',
      'Report discrimination to education office',
      'Seek help from women\'s education programs',
      'Know your rights under education laws',
    ],
    actionsNepali: [
      'विद्यालय/कलेज प्रशासनमा सम्पर्क गर्नुहोस्',
      'छात्रवृत्ति र अनुदानको लागि आवेदन दिनुहोस्',
      'भेदभाव शिक्षा कार्यालयमा रिपोर्ट गर्नुहोस्',
      'महिला शिक्षा कार्यक्रमबाट सहायता लिनुहोस्',
      'शिक्षा कानून अन्तर्गत आफ्नो अधिकार जान्नुहोस्',
    ],
    contacts: [
      { name: 'Ministry of Education', phone: '01-4200000' },
    ],
  },
  health_rights: {
    title: 'Health Rights',
    titleNepali: 'स्वास्थ्य अधिकार',
    laws: [
      {
        act: 'Safe Motherhood and Reproductive Health Rights Act, 2075',
        actNepali: 'सुरक्षित मातृत्व तथा प्रजनन स्वास्थ्य अधिकार ऐन, २०७५',
        description: 'Ensures reproductive health rights and safe motherhood services.',
        descriptionNepali: 'प्रजनन स्वास्थ्य अधिकार र सुरक्षित मातृत्व सेवा सुनिश्चित गर्दछ।',
      },
    ],
    rights: [
      'Right to free maternal health services',
      'Right to safe abortion',
      'Right to family planning services',
      'Right to confidential health care',
      'Right to emergency medical treatment',
    ],
    rightsNepali: [
      'नि:शुल्क मातृ स्वास्थ्य सेवाको अधिकार',
      'सुरक्षित गर्भपतनको अधिकार',
      'परिवार नियोजन सेवाको अधिकार',
      'गोपनीय स्वास्थ्य सेवाको अधिकार',
      'आपतकालीन चिकित्सा उपचारको अधिकार',
    ],
    actions: [
      'Visit nearest health post or hospital',
      'Access free maternal health services',
      'Call ambulance service: 102',
      'Register for health insurance',
      'Know your reproductive rights',
    ],
    actionsNepali: [
      'नजिकको स्वास्थ्य चौकी वा अस्पताल जानुहोस्',
      'नि:शुल्क मातृ स्वास्थ्य सेवा प्रयोग गर्नुहोस्',
      'एम्बुलेन्स सेवामा फोन गर्नुहोस्: १०२',
      'स्वास्थ्य बीमाको लागि दर्ता गर्नुहोस्',
      'आफ्नो प्रजनन अधिकार जान्नुहोस्',
    ],
    contacts: [
      { name: 'Ambulance Service', phone: '102' },
      { name: 'Ministry of Health', phone: '01-4262802' },
    ],
  },
};

// messages state - simple array of chat messages
export default function LegalChatbotScreen() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: '1',
      type: 'bot',
      content: 'नमस्ते! म तपाईंको कानुनी सहायक हुँ।\n\nHello! I\'m your legal rights assistant. I can help you understand your legal rights in Nepal. Please select a topic below:',
      timestamp: new Date(),
    },
  ])
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleTopicSelect = (topicId: string) => {
    // find the topic from the list
    let topic: any = null
    for (let i = 0; i < LEGAL_TOPICS.length; i++) {
      if (LEGAL_TOPICS[i].id === topicId) {
        topic = LEGAL_TOPICS[i]
        break
      }
    }
    if (!topic) return

    // user message shows what topic they picked
    const userMsg = {
      id: Date.now().toString(),
      type: 'user',
      content: `${topic.title} / ${topic.subtitle}`,
      timestamp: new Date(),
    }

    // build the bot response string
    const info = LEGAL_INFO[topicId]
    let botResponse = `${info.titleNepali} / ${info.title}\n\n`

    // add laws section
    botResponse += 'कानूनहरू (Laws):\n'
    for (let i = 0; i < info.laws.length; i++) {
      const law = info.laws[i]
      botResponse += `\n${i + 1}. ${law.actNepali}\n   ${law.act}\n   • ${law.descriptionNepali}\n   • ${law.description}\n`
    }

    // add rights section
    botResponse += '\n\nतपाईंको अधिकारहरू (Your Rights)\n'
    for (let i = 0; i < info.rights.length; i++) {
      botResponse += `\n✓ ${info.rightsNepali[i]}\n  ${info.rights[i]}`
    }

    // add what to do section
    botResponse += '\n\nके गर्ने (What To Do)\n'
    for (let i = 0; i < info.actions.length; i++) {
      botResponse += `\n${i + 1}. ${info.actionsNepali[i]}\n   ${info.actions[i]}`
    }

    // add contact numbers
    botResponse += '\n\nसम्पर्क नम्बरहरू (Contact Numbers)\n'
    for (let i = 0; i < info.contacts.length; i++) {
      botResponse += `\n ${info.contacts[i].name}: ${info.contacts[i].phone}`
    }

    const botMsg = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: botResponse,
      timestamp: new Date(),
      topic: topicId,
    }

    setMessages(prev => [...prev, userMsg, botMsg])
    setSelectedTopic(topicId)

    // scroll to bottom after messages update
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const handleBackToTopics = () => {
    const botMsg = {
      id: Date.now().toString(),
      type: 'bot',
      content: 'के तपाईं अर्को विषय बारे जान्न चाहनुहुन्छ?\n\nWould you like to learn about another topic? Please select below:',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMsg])
    setSelectedTopic(null)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="chatbubbles" size={28} color="#FF6B9D" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.headerTitle}>कानुनी सहायक</Text>
            <Text style={styles.headerSubtitle}>Legal Rights Assistant</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.statusDot} />
          <Text style={{ fontSize: 13, color: '#4CAF50' }}>Online</Text>
        </View>
      </View>

      {/* messages list */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message: any) => {
          const isBot = message.type === 'bot'
          return (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                isBot ? { justifyContent: 'flex-start' } : { justifyContent: 'flex-end' },
              ]}
            >
              {isBot && (
                <View style={styles.botAvatar}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                </View>
              )}
              <View style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}>
                <Text style={[styles.messageText, isBot ? { color: '#2D2D2D' } : { color: '#fff' }]}>
                  {message.content}
                </Text>
                <Text style={[styles.timestamp, isBot ? { color: '#9E9E9E' } : { color: 'rgba(255,255,255,0.8)' }]}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {!isBot && (
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
            </View>
          )
        })}

        {/* topic selection buttons */}
        {!selectedTopic && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.suggestionsTitle}>विषयहरू चयन गर्नुहोस् (Select Topics):</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {LEGAL_TOPICS.map((topic: any) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.suggestionButton, { backgroundColor: topic.color }]}
                  onPress={() => handleTopicSelect(topic.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={topic.icon} size={24} color="#fff" />
                  <Text style={styles.suggestionTitle}>{topic.title}</Text>
                  <Text style={styles.suggestionSubtitle}>{topic.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* back to topics button */}
        {selectedTopic && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToTopics}>
              <Ionicons name="arrow-back-circle" size={20} color="#FF6B9D" />
              <Text style={styles.backButtonText}>More Topics / अरू विषयहरू</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2D7E3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  messagesContainer: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#FF6B9D',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    color: '#6B6B6B',
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 14,
    textAlign: 'center',
  },
  suggestionButton: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B9D',
    marginLeft: 8,
  },
})
