export function Spinner(props) {
  const { sm } = props;
  return (
    <span
      className={`spinner ${sm ? "w-4 h-4" : "w-6 h-6"}`}
      role="status"
      aria-hidden="true"
    ></span>
  );
}
