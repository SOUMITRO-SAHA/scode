import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import fuzzysort from "fuzzysort";
import { filter as filterArray, pipe } from "remeda";

import {
  InputRenderable,
  RGBA,
  ScrollBoxRenderable,
  TextAttributes,
} from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

export interface DialogSelectProps<T> {
  title: string;
  titleView?: React.ReactNode;
  placeholder?: string;
  footer?: React.ReactNode;
  emptyView?: React.ReactNode;
  options: DialogSelectOption<T>[];
  flat?: boolean;
  onSelect?: (option: DialogSelectOption<T>) => void;
  onMove?: (option: DialogSelectOption<T>) => void;
  onFilter?: (query: string) => void;
  skipFilter?: boolean;
  renderFilter?: boolean;
  locked?: boolean;
  onClose?: () => void;
  current?: T;
}

export interface DialogSelectOption<T = unknown> {
  title: string;
  titleView?: React.ReactNode;
  value: T;
  description?: string;
  details?: string[];
  footer?: React.ReactNode | string;
  titleWidth?: number;
  truncateTitle?: boolean | "left";
  category?: string;
  categoryView?: React.ReactNode;
  disabled?: boolean;
  bg?: RGBA;
  gutter?: () => React.ReactNode;
  margin?: React.ReactNode;
}

function selectedForeground(): string {
  return theme.text.inverse;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

function truncateLeft(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return "..." + str.slice(-(maxLen - 3));
}

function truncateMiddle(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const half = Math.floor((maxLen - 3) / 2);
  return str.slice(0, half) + "..." + str.slice(-half);
}

function fuzzyFilter<T>(
  needle: string,
  options: DialogSelectOption<T>[],
): DialogSelectOption<T>[] {
  if (!needle) return options;
  const result = fuzzysort.go(needle, options, {
    keys: ["title", "category"],
    scoreFn: (r) => (r[0]?.score ?? -1000) * 2 + (r[1]?.score ?? -1000),
  });
  return result.map((x) => x.obj);
}

export function DialogSelect<T>(props: DialogSelectProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState("");
  const [inputMode, setInputMode] = useState<"keyboard" | "mouse">("keyboard");
  const inputRef = useRef<InputRenderable | null>(null);
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);

  const dimensions = useTerminalDimensions();

  const filtered = useMemo((): DialogSelectOption<T>[] => {
    const opts = pipe(
      props.options,
      filterArray((x) => x.disabled !== true),
    );
    if (props.skipFilter || props.renderFilter === false) {
      return opts;
    }
    const needle = filter.toLowerCase();
    if (!needle) return opts;
    return fuzzyFilter(needle, opts);
  }, [props.options, props.skipFilter, props.renderFilter, filter]);

  const flatten = useMemo(
    () => props.flat && filter.length > 0,
    [props.flat, filter],
  );

  const grouped = useMemo((): [string, DialogSelectOption<T>[]][] => {
    if (flatten) return [["", filtered]];
    const groups = new Map<string, DialogSelectOption<T>[]>();
    for (const opt of filtered) {
      const cat = opt.category ?? "";
      const existing = groups.get(cat);
      if (existing) {
        existing.push(opt);
      } else {
        groups.set(cat, [opt]);
      }
    }
    return Array.from(groups.entries());
  }, [filtered, flatten]);

  const flatList = useMemo(
    (): DialogSelectOption<T>[] => grouped.flatMap(([, options]) => options),
    [grouped],
  );

  const rows = useMemo(() => {
    const headers = grouped.reduce((acc, [category], i) => {
      if (!category) return acc;
      return acc + (i > 0 ? 2 : 1);
    }, 0);
    return flatList.reduce(
      (acc, option) => acc + 1 + (option.details?.length ?? 0),
      headers,
    );
  }, [grouped, flatList]);

  const height = useMemo(
    () => Math.min(rows, Math.floor(dimensions.height / 2) - 6),
    [rows, dimensions.height],
  );

  const selected = useMemo(
    () => flatList[selectedIndex],
    [flatList, selectedIndex],
  );

  useEffect(() => {
    if (props.current !== undefined) {
      const idx = flatList.findIndex((opt) => {
        if (opt.value === props.current) return true;
        try {
          return JSON.stringify(opt.value) === JSON.stringify(props.current);
        } catch {
          return false;
        }
      });
      if (idx >= 0) setSelectedIndex(idx);
    }
  }, [props.current, flatList]);

  useEffect(() => {
    const r = inputRef.current;
    if (!r || r.isDestroyed) return;
    r.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  const move = useCallback(
    (direction: number) => {
      if (props.locked || flatList.length === 0) return;
      let next = selectedIndex + direction;
      if (next < 0) next = flatList.length - 1;
      if (next >= flatList.length) next = 0;
      setSelectedIndex(next);
      const opt = flatList[next];
      if (opt) props.onMove?.(opt);
    },
    [props.locked, flatList, selectedIndex, props.onMove],
  );

  const submit = useCallback(() => {
    if (props.locked) return;
    setInputMode("keyboard");
    if (selected) {
      props.onSelect?.(selected);
    }
  }, [props.locked, selected, props.onSelect]);

  const handleKeyDown = useCallback(
    (event: { name: string; ctrl: boolean; meta: boolean; shift: boolean }) => {
      if (event.name === "up") {
        setInputMode("keyboard");
        move(-1);
      } else if (event.name === "down") {
        setInputMode("keyboard");
        move(1);
      } else if (event.name === "return" || event.name === "enter") {
        submit();
      } else if (event.name === "escape") {
        props.onClose?.();
      }
    },
    [move, submit, props.onClose],
  );

  const handleInput = useCallback(
    (value: string) => {
      if (props.locked) return;
      setFilter(value);
      props.onFilter?.(value);
    },
    [props.locked, props.onFilter],
  );

  const handleMouseOver = useCallback(
    (index: number) => {
      if (props.locked || inputMode !== "mouse") return;
      setSelectedIndex(index);
    },
    [props.locked, inputMode],
  );

  const handleMouseUp = useCallback(
    (option: DialogSelectOption<T>) => {
      if (props.locked) return;
      props.onSelect?.(option);
    },
    [props.locked, props.onSelect],
  );

  return (
    <box gap={1} paddingBottom={1} flexGrow={1}>
      <box paddingLeft={4} paddingRight={4}>
        <box flexDirection="row" justifyContent="space-between">
          {props.titleView ?? (
            <text fg={theme.text.primary} attributes={TextAttributes.BOLD}>
              {props.title}
            </text>
          )}
          <text fg={theme.text.muted} onMouseUp={() => props.onClose?.()}>
            esc
          </text>
        </box>
        {props.renderFilter !== false && (
          <box paddingTop={1}>
            <input
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              focusedBackgroundColor={theme.background.surface}
              cursorColor={theme.brand.primary}
              focusedTextColor={theme.text.muted}
              ref={(r: InputRenderable) => {
                inputRef.current = r;
              }}
              placeholder={props.placeholder ?? "Search"}
              placeholderColor={theme.text.muted}
            />
          </box>
        )}
      </box>
      <box flexGrow={1} flexShrink={1}>
        {grouped.length > 0 ? (
          <scrollbox
            paddingLeft={1}
            paddingRight={1}
            scrollbarOptions={{ visible: false }}
            ref={(r: ScrollBoxRenderable) => {
              scrollRef.current = r;
            }}
            maxHeight={height}
          >
            {grouped.map(([category, options], groupIndex) => (
              <box key={category || groupIndex}>
                {category && (
                  <box paddingTop={groupIndex > 0 ? 1 : 0} paddingLeft={3}>
                    {options[0]?.categoryView ?? (
                      <text
                        fg={theme.brand.primary}
                        attributes={TextAttributes.BOLD}
                      >
                        {category}
                      </text>
                    )}
                  </box>
                )}
                {options.map((option, optIndex) => {
                  const globalIndex = flatList.indexOf(option);
                  const isActive =
                    !props.locked && globalIndex === selectedIndex;
                  const isCurrent =
                    option.value === props.current ||
                    (() => {
                      try {
                        return (
                          JSON.stringify(option.value) ===
                          JSON.stringify(props.current)
                        );
                      } catch {
                        return false;
                      }
                    })();

                  return (
                    <box
                      key={optIndex}
                      flexDirection="column"
                      position="relative"
                      onMouseMove={() => setInputMode("mouse")}
                      onMouseUp={() => handleMouseUp(option)}
                      onMouseOver={() => handleMouseOver(globalIndex)}
                    >
                      <box
                        flexDirection="row"
                        paddingLeft={isCurrent || option.gutter ? 1 : 3}
                        paddingRight={3}
                        gap={1}
                        backgroundColor={
                          isActive
                            ? (option.bg ?? RGBA.fromInts(0, 120, 215, 255))
                            : RGBA.fromInts(0, 0, 0, 0)
                        }
                      >
                        {!isCurrent && option.margin && (
                          <box position="absolute" left={1} flexShrink={0}>
                            {option.margin}
                          </box>
                        )}
                        <Option
                          title={option.title}
                          titleView={option.titleView}
                          footer={
                            flatten
                              ? (option.category ?? option.footer)
                              : option.footer
                          }
                          titleWidth={option.titleWidth}
                          truncateTitle={option.truncateTitle}
                          description={
                            option.description !== category
                              ? option.description
                              : undefined
                          }
                          active={isActive}
                          current={isCurrent}
                        />
                      </box>
                      {option.details?.map((detail, detailIndex) => (
                        <box key={detailIndex} paddingLeft={3} paddingRight={3}>
                          <text fg={theme.text.muted} wrapMode="none">
                            {truncateMiddle(
                              detail,
                              Math.max(1, Math.min(76, dimensions.width - 12)),
                            )}
                          </text>
                        </box>
                      ))}
                    </box>
                  );
                })}
              </box>
            ))}
          </scrollbox>
        ) : (
          (props.emptyView ?? (
            <box paddingLeft={4} paddingRight={4} paddingTop={1}>
              <text fg={theme.text.muted}>No results found</text>
            </box>
          ))
        )}
      </box>
      {props.footer && (
        <box
          paddingRight={2}
          paddingLeft={4}
          flexDirection="row"
          justifyContent="space-between"
          flexShrink={0}
        >
          {props.footer}
        </box>
      )}
    </box>
  );
}

function Option(props: {
  title: string;
  titleView?: React.ReactNode;
  description?: string;
  active?: boolean;
  current?: boolean;
  footer?: React.ReactNode | string;
  titleWidth?: number;
  truncateTitle?: boolean | "left";
}) {
  const fg = selectedForeground();

  const text = useMemo(() => {
    if (props.active) return fg;
    if (props.current) return theme.brand.primary;
    return theme.text.primary;
  }, [props.active, props.current, fg]);

  const displayTitle = useMemo(() => {
    if (props.titleView) return null;
    if (props.truncateTitle === false) return props.title;
    const maxLen = props.titleWidth ?? 61;
    if (props.truncateTitle === "left")
      return truncateLeft(props.title, maxLen);
    return truncate(props.title, maxLen);
  }, [props.title, props.titleView, props.truncateTitle, props.titleWidth]);

  return (
    <>
      {props.current && (
        <text flexShrink={0} fg={text} marginRight={0}>
          ●
        </text>
      )}
      <text
        flexGrow={1}
        fg={text}
        attributes={props.active ? TextAttributes.BOLD : undefined}
        overflow="hidden"
        wrapMode="none"
        paddingLeft={3}
      >
        {props.titleView ?? displayTitle}
        {props.description && (
          <text fg={props.active ? fg : theme.text.muted}>
            {" "}
            {props.description}
          </text>
        )}
      </text>
      {props.footer && (
        <box flexShrink={0}>
          <text fg={props.active ? fg : theme.text.muted}>{props.footer}</text>
        </box>
      )}
    </>
  );
}
