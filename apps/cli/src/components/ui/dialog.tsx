import {
  Fragment,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  actions?: {
    command: string;
    title: string;
    side?: "left" | "right";
    hidden?: boolean;
    disabled?:
      | boolean
      | ((option: DialogSelectOption<T> | undefined) => boolean);
    onTrigger: (option: DialogSelectOption<T>) => void;
  }[];
  footerHints?: {
    title: string;
    label: string;
    side?: "left" | "right";
  }[];
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
  onSelect?: () => void;
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
  const [focusedActionIdx, setFocusedActionIdx] = useState<number | undefined>(
    undefined,
  );
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

  const scrollToIndex = useCallback(
    (index: number, center = false) => {
      const scroll = scrollRef.current;
      if (!scroll) return;

      let remaining = index;
      let rowIndex = 0;

      for (const [category, options] of grouped) {
        if (category) rowIndex++;
        if (remaining < options.length) {
          rowIndex += remaining;
          break;
        }
        rowIndex += options.length;
        remaining -= options.length;
      }

      const children = scroll.getChildren();
      const target = children[rowIndex];
      if (!target) return;

      const y = target.y - scroll.y;

      if (center) {
        const centerOffset = Math.floor(scroll.height / 2);
        scroll.scrollBy(y - centerOffset);
      } else {
        if (y >= scroll.height) {
          scroll.scrollBy(y - scroll.height + 1);
        }
        if (y < 0) {
          scroll.scrollBy(y);
          if (index === 0) {
            scroll.scrollTo(0);
          }
        }
      }
    },
    [grouped],
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
      if (idx >= 0) {
        setSelectedIndex(idx);
        setTimeout(() => scrollToIndex(idx, true), 0);
      }
    }
  }, [props.current, flatList, scrollToIndex]);

  useEffect(() => {
    const r = inputRef.current;
    if (!r || r.isDestroyed) return;
    r.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
    setFocusedActionIdx(undefined);
    setTimeout(() => scrollToIndex(0, false), 0);
  }, [filter, scrollToIndex]);

  const moveTo = useCallback(
    (next: number, center = false) => {
      if (props.locked || flatList.length === 0) return;
      setSelectedIndex(next);
      setFocusedActionIdx(undefined);
      const opt = flatList[next];
      if (opt) props.onMove?.(opt);
      scrollToIndex(next, center);
    },
    [props.locked, flatList, props.onMove, scrollToIndex],
  );

  const move = useCallback(
    (direction: number) => {
      if (props.locked || flatList.length === 0) return;
      let next = selectedIndex + direction;
      if (next < 0) next = flatList.length - 1;
      if (next >= flatList.length) next = 0;
      moveTo(next, true);
    },
    [props.locked, flatList, selectedIndex, moveTo],
  );

  const movePage = useCallback(
    (direction: number) => {
      if (props.locked || flatList.length === 0) return;
      let next = selectedIndex + direction * 10;
      if (next < 0) next = 0;
      if (next >= flatList.length) next = flatList.length - 1;
      moveTo(next, true);
    },
    [props.locked, flatList, selectedIndex, moveTo],
  );

  const moveHome = useCallback(() => {
    if (props.locked || flatList.length === 0) return;
    moveTo(0, false);
  }, [props.locked, flatList, moveTo]);

  const moveEnd = useCallback(() => {
    if (props.locked || flatList.length === 0) return;
    moveTo(flatList.length - 1, false);
  }, [props.locked, flatList, moveTo]);

  const submit = useCallback(() => {
    if (props.locked) return;
    setInputMode("keyboard");
    const index = focusedActionIdx;
    const actions = (props.actions ?? []).filter((a) => !a.hidden);
    if (index !== undefined && actions[index]) {
      if (selected) actions[index].onTrigger(selected);
      return;
    }
    if (selected) {
      selected.onSelect?.();
      props.onSelect?.(selected);
    }
  }, [props.locked, focusedActionIdx, props.actions, selected, props.onSelect]);

  const moveAction = useCallback(
    (direction: 1 | -1) => {
      if (props.locked) return;
      const actions = (props.actions ?? []).filter(
        (a) =>
          !a.hidden &&
          !(typeof a.disabled === "function"
            ? a.disabled(selected)
            : a.disabled),
      );
      if (actions.length === 0) return;
      setFocusedActionIdx((idx) => {
        if (idx === undefined) return direction === 1 ? 0 : actions.length - 1;
        const next = idx + direction;
        return next < 0 || next >= actions.length ? undefined : next;
      });
    },
    [props.locked, props.actions, selected],
  );

  const handleKeyDown = useCallback(
    (event: { name: string; ctrl: boolean; meta: boolean; shift: boolean }) => {
      if (event.name === "up") {
        setInputMode("keyboard");
        move(-1);
      } else if (event.name === "down") {
        setInputMode("keyboard");
        move(1);
      } else if (event.name === "pageup") {
        setInputMode("keyboard");
        movePage(-1);
      } else if (event.name === "pagedown") {
        setInputMode("keyboard");
        movePage(1);
      } else if (event.name === "home") {
        setInputMode("keyboard");
        moveHome();
      } else if (event.name === "end") {
        setInputMode("keyboard");
        moveEnd();
      } else if (event.name === "return" || event.name === "enter") {
        submit();
      } else if (event.name === "escape") {
        props.onClose?.();
      } else if (event.name === "tab") {
        setInputMode("keyboard");
        moveAction(1);
      } else if (
        event.name === "shift-tab" ||
        (event.shift && event.name === "tab")
      ) {
        setInputMode("keyboard");
        moveAction(-1);
      }
    },
    [move, movePage, moveHome, moveEnd, submit, props.onClose, moveAction],
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
      option.onSelect?.();
      props.onSelect?.(option);
    },
    [props.locked, props.onSelect],
  );

  const shownActions = useMemo(
    () => (props.actions ?? []).filter((a) => !a.hidden),
    [props.actions],
  );

  const actionItems = useMemo(
    () =>
      shownActions.filter((a) => {
        if (typeof a.disabled === "function") return !a.disabled(selected);
        return !a.disabled;
      }),
    [shownActions, selected],
  );

  const leftHints = useMemo(
    () => [
      ...actionItems
        .filter((a) => a.side !== "right")
        .map((a) => ({ ...a, isAction: true as const })),
      ...(props.footerHints ?? [])
        .filter((h) => h.side !== "right")
        .map((h) => ({ ...h, isAction: false as const })),
    ],
    [actionItems, props.footerHints],
  );

  const rightHints = useMemo(
    () => [
      ...actionItems
        .filter((a) => a.side === "right")
        .map((a) => ({ ...a, isAction: true as const })),
      ...(props.footerHints ?? [])
        .filter((h) => h.side === "right")
        .map((h) => ({ ...h, isAction: false as const })),
    ],
    [actionItems, props.footerHints],
  );

  return (
    <box gap={1} paddingBottom={1} flexGrow={1}>
      <box paddingLeft={4} paddingRight={4}>
        <box flexDirection="row" justifyContent="space-between">
          {props.titleView ?? (
            <text fg={theme.text.secondary} attributes={TextAttributes.BOLD}>
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
              <Fragment key={category || groupIndex}>
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
                        paddingLeft={option.gutter ? 1 : 3}
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
              </Fragment>
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
      {(props.footer || leftHints.length > 0 || rightHints.length > 0) && (
        <box
          paddingRight={2}
          paddingLeft={4}
          flexDirection="row"
          justifyContent="space-between"
          flexShrink={0}
        >
          <box flexDirection="row" gap={2}>
            {props.footer}
            {leftHints.map((hint, i) =>
              hint.isAction ? (
                <FooterAction
                  key={hint.command}
                  title={hint.title}
                  label={""}
                  focused={focusedActionIdx === actionItems.indexOf(hint)}
                  disabled={
                    typeof hint.disabled === "function"
                      ? !!hint.disabled(selected)
                      : !!hint.disabled
                  }
                  onTrigger={() => {
                    if (selected) hint.onTrigger(selected);
                  }}
                />
              ) : (
                <FooterHint key={i} title={hint.title} label={hint.label} />
              ),
            )}
          </box>
          <box flexDirection="row" gap={2}>
            {rightHints.map((hint, i) =>
              hint.isAction ? (
                <FooterAction
                  key={hint.command}
                  title={hint.title}
                  label={""}
                  focused={focusedActionIdx === actionItems.indexOf(hint)}
                  disabled={
                    typeof hint.disabled === "function"
                      ? !!hint.disabled(selected)
                      : !!hint.disabled
                  }
                  onTrigger={() => {
                    if (selected) hint.onTrigger(selected);
                  }}
                />
              ) : (
                <FooterHint key={i} title={hint.title} label={hint.label} />
              ),
            )}
          </box>
        </box>
      )}
    </box>
  );
}

function FooterHint(props: { title: string; label: string }) {
  return (
    <box flexDirection="row" gap={0}>
      <text fg={theme.text.primary}>{props.title}</text>
      <text fg={theme.text.muted}> {props.label}</text>
    </box>
  );
}

function FooterAction(props: {
  title: string;
  label: string;
  focused: boolean;
  disabled: boolean;
  onTrigger: () => void;
}) {
  const fg = selectedForeground();
  return (
    <box
      flexDirection="row"
      backgroundColor={
        props.focused ? theme.background.hover : RGBA.fromInts(0, 0, 0, 0)
      }
      onMouseUp={props.onTrigger}
    >
      <text
        fg={
          props.disabled
            ? theme.text.disabled
            : props.focused
              ? fg
              : theme.text.primary
        }
        attributes={props.focused ? TextAttributes.BOLD : undefined}
      >
        {props.title}
      </text>
      {props.label && (
        <text
          fg={
            props.disabled
              ? theme.text.disabled
              : props.focused
                ? fg
                : theme.text.muted
          }
        >
          {" "}
          {props.label}
        </text>
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
      <box flexDirection="row" flexGrow={1} marginLeft={1} overflow="hidden">
        {props.titleView ? (
          props.titleView
        ) : (
          <>
            <text
              fg={text}
              attributes={props.active ? TextAttributes.BOLD : undefined}
              wrapMode="none"
              paddingLeft={3}
            >
              {displayTitle}
            </text>
            {props.description && (
              <text fg={props.active ? fg : theme.text.muted} wrapMode="none">
                {` ${props.description}`}
              </text>
            )}
          </>
        )}
      </box>
      {props.footer && (
        <box flexShrink={0}>
          {typeof props.footer === "string" ? (
            <text fg={props.active ? fg : theme.text.muted}>
              {props.footer}
            </text>
          ) : (
            props.footer
          )}
        </box>
      )}
    </>
  );
}

export interface DialogContextValue {
  clear: () => void;
  replace: (element: ReactNode, onClose?: () => void) => void;
  stack: Array<{ element: ReactNode; onClose?: () => void }>;
  size: "medium" | "large" | "xlarge";
  setSize: (size: "medium" | "large" | "xlarge") => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const value = useContext(DialogContext);
  if (!value) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return value;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<
    Array<{ element: ReactNode; onClose?: () => void }>
  >([]);
  const [size, setSize] = useState<"medium" | "large" | "xlarge">("medium");

  const clear = useCallback(() => {
    for (const item of stack) {
      item.onClose?.();
    }
    setStack([]);
    setSize("medium");
  }, [stack]);

  const replace = useCallback(
    (element: ReactNode, onClose?: () => void) => {
      for (const item of stack) {
        item.onClose?.();
      }
      setStack([{ element, onClose }]);
      setSize("medium");
    },
    [stack],
  );

  const value = useMemo<DialogContextValue>(
    () => ({ clear, replace, stack, size, setSize }),
    [clear, replace, stack, size],
  );

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}
