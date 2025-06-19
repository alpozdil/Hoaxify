import { Spinner } from "./Spinner";

export function Button(props) {
  const { disabled, apiProgress, children, styleType, onClick } = props;
  
  return (
    <button 
      className={`btn btn-${styleType || "primary"}`}
      disabled={disabled || apiProgress}
      onClick={onClick}
    >
      {apiProgress && <Spinner sm />}
      <span className={apiProgress ? "ml-2" : ""}>{children}</span>
    </button>
  );
}
