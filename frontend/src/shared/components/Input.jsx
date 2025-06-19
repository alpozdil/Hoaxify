export function Input(props) {
    const { id, label, error, onChange, type, defaultValue } = props;

  return (
    <div className="mb-6">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        className={error ? "form-control border-red-500 focus:border-red-500 focus:ring-red-200" : "form-control"}
        onChange={onChange}
        type={type}
        defaultValue={defaultValue}
      />
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
