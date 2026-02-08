import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

/* ───────── Sprite sets ───────── */

const ORIGINAL_FRAMES: ImageSourcePropType[] = [
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

/*
const BROWN_HORSE_FRAMES: ImageSourcePropType[] = [
  require("@/assets/images/horse_animation/brown_horse/tile_0.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_1.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_2.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_3.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_4.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_5.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_6.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_7.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_8.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_9.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_10.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_11.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_12.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_13.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_14.png"),
  require("@/assets/images/horse_animation/brown_horse/tile_15.png"),
];

const GOLDEN_HORSE_FRAMES: ImageSourcePropType[] = [
  require("@/assets/images/horse_animation/golden_horse/tile_0.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_1.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_2.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_3.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_4.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_5.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_6.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_7.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_8.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_9.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_10.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_11.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_12.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_13.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_14.png"),
  require("@/assets/images/horse_animation/golden_horse/tile_15.png"),
];

const SPOTTED_HORSE_FRAMES: ImageSourcePropType[] = [
  require("@/assets/images/horse_animation/spotted_horse/tile_0.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_1.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_2.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_3.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_4.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_5.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_6.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_7.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_8.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_9.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_10.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_11.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_12.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_13.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_14.png"),
  require("@/assets/images/horse_animation/spotted_horse/tile_15.png"),
];

const WHITE_HORSE_FRAMES: ImageSourcePropType[] = [
  require("@/assets/images/horse_animation/white_horse/tile_0.png"),
  require("@/assets/images/horse_animation/white_horse/tile_1.png"),
  require("@/assets/images/horse_animation/white_horse/tile_2.png"),
  require("@/assets/images/horse_animation/white_horse/tile_3.png"),
  require("@/assets/images/horse_animation/white_horse/tile_4.png"),
  require("@/assets/images/horse_animation/white_horse/tile_5.png"),
  require("@/assets/images/horse_animation/white_horse/tile_6.png"),
  require("@/assets/images/horse_animation/white_horse/tile_7.png"),
  require("@/assets/images/horse_animation/white_horse/tile_8.png"),
  require("@/assets/images/horse_animation/white_horse/tile_9.png"),
  require("@/assets/images/horse_animation/white_horse/tile_10.png"),
  require("@/assets/images/horse_animation/white_horse/tile_11.png"),
  require("@/assets/images/horse_animation/white_horse/tile_12.png"),
  require("@/assets/images/horse_animation/white_horse/tile_13.png"),
  require("@/assets/images/horse_animation/white_horse/tile_14.png"),
  require("@/assets/images/horse_animation/white_horse/tile_15.png"),
];
*/

// For now, only use original. Uncomment above and add to this array to cycle through different horses per spawn.
const HORSE_SETS: ImageSourcePropType[][] = [
  ORIGINAL_FRAMES,
  // BROWN_HORSE_FRAMES,
  // GOLDEN_HORSE_FRAMES,
  // SPOTTED_HORSE_FRAMES,
  // WHITE_HORSE_FRAMES,
];

const SPRITE_WIDTH = 80;
const SPRITE_HEIGHT = 50;
const FRAME_INTERVAL = 60;
const RUN_TO_CENTER_DURATION = 2000;
const RUN_OFF_SCREEN_DURATION = 1500;
const RESPAWN_DELAY = 1000;

// Animation phases:
// "entering"   – horse runs from left edge to center
// "idle"       – horse runs in place at center, waiting for tap
// "exiting"    – horse runs from center to off-screen right
// "hidden"     – horse is invisible, waiting to respawn
type Phase = "entering" | "idle" | "exiting" | "hidden";

export default function RunningHorse() {
  const screenWidth = Dimensions.get("window").width;
  const centerX = (screenWidth - SPRITE_WIDTH) / 2;

  const translateX = useRef(new Animated.Value(-SPRITE_WIDTH)).current;
  const [frameIndex, setFrameIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [horseSetIndex, setHorseSetIndex] = useState(0);
  const spriteInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const respawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const frames = HORSE_SETS[horseSetIndex % HORSE_SETS.length];

  const startSpriteLoop = useCallback(() => {
    if (spriteInterval.current) return;
    spriteInterval.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % ORIGINAL_FRAMES.length);
    }, FRAME_INTERVAL);
  }, []);

  const stopSpriteLoop = useCallback(() => {
    if (spriteInterval.current) {
      clearInterval(spriteInterval.current);
      spriteInterval.current = null;
    }
  }, []);

  // Spawn: start the entering animation
  const spawn = useCallback(() => {
    setFrameIndex(0);
    translateX.setValue(-SPRITE_WIDTH);
    setPhase("entering");
    startSpriteLoop();

    Animated.timing(translateX, {
      toValue: centerX,
      duration: RUN_TO_CENTER_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPhase("idle");
      }
    });
  }, [centerX, translateX, startSpriteLoop]);

  // Exit: run off the right side of the screen
  const exit = useCallback(() => {
    setPhase("exiting");

    Animated.timing(translateX, {
      toValue: screenWidth + SPRITE_WIDTH,
      duration: RUN_OFF_SCREEN_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        stopSpriteLoop();
        setPhase("hidden");

        // Cycle to next horse set for the respawn
        setHorseSetIndex((prev) => prev + 1);

        // Respawn after delay
        respawnTimer.current = setTimeout(() => {
          spawn();
        }, RESPAWN_DELAY);
      }
    });
  }, [screenWidth, translateX, stopSpriteLoop, spawn]);

  // Handle tap on the horse
  const handlePress = useCallback(() => {
    if (phase === "idle") {
      exit();
    }
  }, [phase, exit]);

  // Initial spawn on mount
  useEffect(() => {
    spawn();

    return () => {
      stopSpriteLoop();
      if (respawnTimer.current) clearTimeout(respawnTimer.current);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX }] },
      ]}
    >
      <Pressable onPress={handlePress}>
        <View style={styles.spriteContainer}>
          {frames.map((source, i) => (
            <Animated.Image
              key={i}
              source={source}
              style={[
                styles.sprite,
                { opacity: i === frameIndex ? 1 : 0 },
              ]}
              resizeMode="contain"
            />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 40,
    zIndex: 10,
  },
  spriteContainer: {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
  },
  sprite: {
    position: "absolute",
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
  },
});
