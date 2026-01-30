import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

const { width, height } = Dimensions.get('window');

type LessonDetailModalProps = {
  visible: boolean;
  lesson: any;
  onClose: () => void;
};

export default function LessonDetailModal({ visible, lesson, onClose }: LessonDetailModalProps) {
  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<any>({});

  if (!lesson) return null;

  const openYouTubeVideo = async () => {
    if (lesson.video_url) {
      try {
        const canOpen = await Linking.canOpenURL(lesson.video_url);
        if (canOpen) {
          await Linking.openURL(lesson.video_url);
        } else {
          Alert.alert('Error', 'Cannot open video URL');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open video');
      }
    }
  };

  const getYouTubeThumbnail = (videoUrl: string) => {
    try {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } catch (error) {
      console.error('Error extracting YouTube thumbnail:', error);
    }
    return lesson.thumbnail_url;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{lesson.title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Video Player */}
          {lesson.video_url && (
            <Card style={styles.videoCard}>
              <TouchableOpacity 
                onPress={openYouTubeVideo}
                style={styles.videoThumbnailContainer}
              >
                <Video
                  ref={videoRef}
                  style={styles.videoThumbnail}
                  source={{ uri: getYouTubeThumbnail(lesson.video_url) }}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                />
                <View style={styles.playOverlay}>
                  <View style={styles.playButton}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <Text style={styles.watchOnYouTube}>Watch on YouTube</Text>
                </View>
              </TouchableOpacity>
              
              <Button
                title="🎥 Open Video Tutorial"
                onPress={openYouTubeVideo}
                variant="primary"
                style={styles.openVideoButton}
              />
            </Card>
          )}

          {/* Lesson Info */}
          <Card style={styles.infoCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaIcon}>⏱️</Text>
                <Text style={styles.metaText}>{lesson.duration} minutes</Text>
              </View>
              <View 
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(lesson.difficulty) }
                ]}
              >
                <Text style={styles.difficultyText}>{lesson.difficulty}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaIcon}>🎯</Text>
                <Text style={styles.metaText}>{lesson.techniques.length} techniques</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.description}>{lesson.description}</Text>
          </Card>

          {/* Techniques */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>✊ Techniques Covered</Text>
            {lesson.techniques.map((technique: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.listItemText}>{technique}</Text>
              </View>
            ))}
          </Card>

          {/* Focus Areas */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🎯 Focus Areas</Text>
            <View style={styles.tagsContainer}>
              {lesson.focus_areas.map((area: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{area}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* BMI Category Info */}
          <Card style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>
              {lesson.category === 'CATEGORY_1' ? '⚡ Agility Focus' : '💪 Strength Focus'}
            </Text>
            <Text style={styles.categorySubtitle}>{lesson.bmi_range}</Text>
            <Text style={styles.categoryDescription}>
              {lesson.category === 'CATEGORY_1'
                ? 'This lesson is tailored for individuals with normal to underweight BMI. Focus on speed, agility, and precision techniques.'
                : 'This lesson is designed for individuals with overweight to obesity range BMI. Emphasis on power, leverage, and strength-based techniques.'}
            </Text>
          </Card>

          {/* Animated Instruction Note */}
          {lesson.animation_url && (
            <Card style={styles.animationCard}>
              <Text style={styles.animationTitle}>🎬 Animated Instructions</Text>
              <Text style={styles.animationText}>
                This lesson includes animated demonstrations to help you visualize the techniques.
              </Text>
            </Card>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return Colors.light.success;
    case 'intermediate':
      return Colors.light.secondary;
    case 'advanced':
      return Colors.light.danger;
    default:
      return Colors.light.gray500;
  }
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.tertiary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.gray200,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
    marginRight: Spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Typography.sizes.xl,
    color: Colors.light.gray600,
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  videoCard: {
    margin: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  videoThumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.light.gray200,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  playIcon: {
    fontSize: 28,
    color: Colors.light.background,
    marginLeft: 4,
  },
  watchOnYouTube: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.background,
  },
  openVideoButton: {
    margin: Spacing.md,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.text,
    fontWeight: Typography.weights.medium,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  difficultyText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.background,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.gray300,
    marginVertical: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.md,
    color: Colors.light.gray600,
    lineHeight: 22,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 8,
    marginRight: Spacing.sm,
  },
  listItemText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.light.gray600,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.light.tertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tagText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.text,
    fontWeight: Typography.weights.medium,
  },
  categoryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.light.background,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  categoryTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  categorySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.gray600,
    marginBottom: Spacing.sm,
  },
  categoryDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.light.gray600,
    lineHeight: 22,
  },
  animationCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.light.success + '10',
    borderWidth: 1,
    borderColor: Colors.light.success,
  },
  animationTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.success,
    marginBottom: Spacing.xs,
  },
  animationText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.gray600,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
