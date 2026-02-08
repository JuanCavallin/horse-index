import { useEffect, useRef, useState, useMemo } from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

const HORSE_SETS: ImageSourcePropType[][] = [
  // original
  [
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
  ],
  /*
  // brown_horse
  [
    require("@/assets/images/horse_animation/brown_horse/frame_0.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_1.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_2.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_3.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_4.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_5.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_6.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_7.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_8.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_9.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_10.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_11.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_12.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_13.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_14.png"),
    require("@/assets/images/horse_animation/brown_horse/frame_15.png"),
  ],
  // golden_horse
  [
    require("@/assets/images/horse_animation/golden_horse/frame_0.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_1.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_2.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_3.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_4.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_5.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_6.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_7.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_8.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_9.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_10.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_11.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_12.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_13.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_14.png"),
    require("@/assets/images/horse_animation/golden_horse/frame_15.png"),
  ],
  // spotted_horse
  [
    require("@/assets/images/horse_animation/spotted_horse/frame_0.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_1.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_2.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_3.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_4.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_5.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_6.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_7.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_8.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_9.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_10.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_11.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_12.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_13.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_14.png"),
    require("@/assets/images/horse_animation/spotted_horse/frame_15.png"),
  ],
  // white_horse
  [
    require("@/assets/images/horse_animation/white_horse/frame_0.png"),
    require("@/assets/images/horse_animation/white_horse/frame_1.png"),
    require("@/assets/images/horse_animation/white_horse/frame_2.png"),
    require("@/assets/images/horse_animation/white_horse/frame_3.png"),
    require("@/assets/images/horse_animation/white_horse/frame_4.png"),
    require("@/assets/images/horse_animation/white_horse/frame_5.png"),
    require("@/assets/images/horse_animation/white_horse/frame_6.png"),
    require("@/assets/images/horse_animation/white_horse/frame_7.png"),
    require("@/assets/images/horse_animation/white_horse/frame_8.png"),
    require("@/assets/images/horse_animation/white_horse/frame_9.png"),
    require("@/assets/images/horse_animation/white_horse/frame_10.png"),
    require("@/assets/images/horse_animation/white_horse/frame_11.png"),
    require("@/assets/images/horse_animation/white_horse/frame_12.png"),
    require("@/assets/images/horse_animation/white_horse/frame_13.png"),
    require("@/assets/images/horse_animation/white_horse/frame_14.png"),
    require("@/assets/images/horse_animation/white_horse/frame_15.png"),
  ],
  */
];

const SPRITE_WIDTH = 120;
const SPRITE_HEIGHT = 75;
const FRAME_INTERVAL = 60;

export default function LoadingHorse() {
  const frames = useMemo(
    () => HORSE_SETS[Math.floor(Math.random() * HORSE_SETS.length)],
    []
  );
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, FRAME_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [frames]);

  // All frames rendered stacked; only active frame has opacity 1.
  // This pre-loads every image so frame switches are instant.
  return (
    <View style={styles.container}>
      <View style={styles.spriteContainer}>
        {frames.map((src, i) => (
          <Image
            key={i}
            source={src}
            style={[
              styles.sprite,
              { position: i === 0 ? "relative" : "absolute", opacity: i === frameIndex ? 1 : 0 },
            ]}
            resizeMode="contain"
          />
        ))}
      </View>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  spriteContainer: {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
  },
  sprite: {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "500",
    color: "#888",
    letterSpacing: 1,
  },
});
