export function Alert(props) {
  const { children, styleType, center } = props;
  return (
    <div className={`alert alert-${styleType || "success"} ${center ? 'text-center' : ''} shadow-sm border-0`}>
      {children}
    </div>
  );
}
