import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import AssetIcon from "./AssetIcon";
import { assets } from "../constants/assets";
import s from "./CustomSelect.module.css";

const supportedAssetIcons = new Set(assets);

function optionText(children) {
  return Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement(child)
          ? optionText(child.props.children)
          : "",
    )
    .join("");
}

export default function CustomSelect({
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  name,
  id,
  assetIcons = false,
  "aria-labelledby": labelledBy,
  ...selectProps
}) {
  const options = useMemo(
    () =>
      Children.toArray(children)
        .filter((child) => isValidElement(child) && child.type === "option")
        .map((child) => ({
          value: String(child.props.value ?? optionText(child.props.children)),
          label: child.props.children,
          text: optionText(child.props.children),
          disabled: Boolean(child.props.disabled),
        })),
    [children],
  );
  const fallback = String(
    defaultValue ?? options.find((option) => !option.disabled)?.value ?? "",
  );
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(fallback);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [invalid, setInvalid] = useState(false);
  const rootRef = useRef(null);
  const selectRef = useRef(null);
  const currentValue = controlled ? String(value ?? "") : internalValue;
  const selected = options.find((option) => option.value === currentValue);
  const showAssetIcon = (option) =>
    assetIcons && supportedAssetIcons.has(option?.value);

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    const form = selectRef.current?.form;
    if (!form || controlled) return undefined;
    const reset = () =>
      setTimeout(() => {
        setInternalValue(fallback);
        setInvalid(false);
        setOpen(false);
      }, 0);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [controlled, fallback]);

  function move(direction) {
    if (!options.length) return;
    let next = activeIndex;
    for (let count = 0; count < options.length; count += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    setActiveIndex(next);
  }

  function show() {
    if (disabled) return;
    const selectedIndex = options.findIndex(
      (option) => option.value === currentValue && !option.disabled,
    );
    setActiveIndex(
      selectedIndex >= 0
        ? selectedIndex
        : options.findIndex((option) => !option.disabled),
    );
    setOpen(true);
  }

  function choose(option) {
    if (option.disabled) return;
    if (!controlled) setInternalValue(option.value);
    setInvalid(false);
    if (selectRef.current) selectRef.current.value = option.value;
    onChange?.({
      target: selectRef.current,
      currentTarget: selectRef.current,
      type: "change",
    });
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      if (!open) show();
      else move(event.key === "ArrowDown" ? 1 : -1);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      if (activeIndex >= 0) choose(options[activeIndex]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(options.findIndex((option) => !option.disabled));
    } else if (event.key === "End" && open) {
      event.preventDefault();
      for (let index = options.length - 1; index >= 0; index -= 1) {
        if (!options[index].disabled) {
          setActiveIndex(index);
          break;
        }
      }
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`${s.root} ${open ? s.open : ""} ${disabled ? s.disabled : ""} ${invalid ? s.invalid : ""}`}
    >
      <select
        {...selectProps}
        ref={selectRef}
        className={s.native}
        id={id}
        name={name}
        value={currentValue}
        required={required}
        disabled={disabled}
        onChange={(event) => {
          if (!controlled) setInternalValue(event.target.value);
          setInvalid(false);
          onChange?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          rootRef.current?.querySelector("button")?.focus();
        }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {children}
      </select>
      <button
        type="button"
        className={s.trigger}
        disabled={disabled}
        aria-labelledby={`${labelledBy} ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={handleKeyDown}
      >
        <span id={`${id}-value`} className={`${s.value} ${!selected?.value ? s.placeholder : ""}`}>
          {showAssetIcon(selected) && <AssetIcon asset={selected.value} size={24} />}
          <span>{selected?.label || "Select an option"}</span>
        </span>
        <FiChevronDown />
      </button>
      {open && (
        <div className={s.menu} role="listbox" aria-labelledby={labelledBy}>
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === currentValue}
              className={`${s.option} ${index === activeIndex ? s.active : ""}`}
              disabled={option.disabled}
              key={`${option.value}-${index}`}
              onPointerMove={() => !option.disabled && setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span className={s.value}>
                {showAssetIcon(option) && <AssetIcon asset={option.value} size={25} />}
                <span>{option.label}</span>
              </span>
              {option.value === currentValue && <FiCheck />}
            </button>
          ))}
        </div>
      )}
      {invalid && (
        <span className={s.validation} role="alert">
          Please select an option.
        </span>
      )}
    </div>
  );
}
