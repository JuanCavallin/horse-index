import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";

const FRAMES: ImageSourcePropType[] = [
  require("@/assets/images/horse_animation/original/tile_0.png"),
  require("@/assets/images/horse_animation/original/tile_1.png"),
  require("@/assets/images/horse_animation/original/tile_2.png"),
  require("@/assets/images/horse_animation/original/tile_3.png"),
  require("@/assets/images/horse_animation/original/tile_4.png"),
  require("@/assets/images/horse_animation/original/tile_5.png"),
  require("@/assets/images/horse_animation/original/tile_6.png"),
  require("@/assets/images/horse_animation/original/tile_7.png"),
  require("@/assets/images/horse_animation/original/tile_8.png"),
  require("@/assets/images/horse_animation/original/tile_9.png"),
  require("@/assets/images/horse_animation/original/tile_10.png"),
  require("@/assets/images/horse_animation/original/tile_11.png"),
  require("@/assets/images/horse_animation/original/tile_12.png"),
  require("@/assets/images/horse_animation/original/tile_13.png"),
  require("@/assets/images/horse_animation/original/tile_14.png"),
  require("@/assets/images/horse_animation/original/tile_15.png"),
];

const SPRITE_WIDTH = 80;
const SPRITE_HEIGHT = 50;
const FRAME_INTERVAL = 60; // ms per sprite frame
const CROSSING_DURATION = 3000; // ms to cross the screen

interface RunningHorseProps {
  position: "top" | "bottom";
  /** Delay in ms before the run starts */
  delay: number;
  /** Called when the horse finishes running off screen */
  onFinished?: () => void;
  /** When true, the horse runs and animates. When false, nothing renders. */
  running: boolean;
}

export default function RunningHorse({
  position,
  delay,
  onFinished,
  running,
}: RunningHorseProps) {
  const screenWidth = Dimensions.get("window").width;
  const translateX = useRef(new Animated.Value(0)).current;
  const [frameIndex, setFrameIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const spriteInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Direction: top = left-to-right, bottom = right-to-left
  const goingRight = position === "top";
  const startX = goingRight ? -SPRITE_WIDTH : screenWidth;
  const endX = goingRight ? screenWidth : -SPRITE_WIDTH;

  const cleanup = useCallback(() => {
    if (spriteInterval.current) {
      clearInterval(spriteInterval.current);
      spriteInterval.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) {
      setVisible(false);
      cleanup();
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      setFrameIndex(0);
      translateX.setValue(startX);

      // Start sprite cycling
      spriteInterval.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % FRAMES.length);
      }, FRAME_INTERVAL);

      // Slide across screen
      Animated.timing(translateX, {
        toValue: endX,
        duration: CROSSING_DURATION,
        useNativeDriver: true,
      }).start(() => {
        cleanup();
        setVisible(false);
        onFinished?.();
      });
    }, delay);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [running]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === "top" ? styles.top : styles.bottom,
        { transform: [{ translateX }] },
      ]}
    >
      <Image
        source={FRAMES[frameIndex]}
        style={[
          styles.sprite,
          // Flip horizontally when going right-to-left (bottom)
          !goingRight && { transform: [{ scaleX: -1 }] },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 10,
  },
  top: {
    top: 40,
  },
  bottom: {
    bottom: 40,
  },
  sprite: {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
  },
});
