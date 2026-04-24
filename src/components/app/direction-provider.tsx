"use client";

import * as React from "react";

type Direction = "ltr" | "rtl";

const DirectionContext = React.createContext<Direction>("ltr");

type DirectionProviderProps = {
  dir: Direction;
  children: React.ReactNode;
};

export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  return <DirectionContext.Provider value={dir}>{children}</DirectionContext.Provider>;
}

export function useDirection(): Direction {
  return React.useContext(DirectionContext);
}
