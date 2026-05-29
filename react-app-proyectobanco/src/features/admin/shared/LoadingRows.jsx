const LoadingRows = ({ cols }) => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <tr key={i} className="loading-rows">
        {Array(cols)
          .fill(0)
          .map((_, j) => (
            <td key={j}>
              <div className="skeleton" style={{ width: j === 0 ? '60%' : '80%' }} />
            </td>
          ))}
      </tr>
    ))}
  </>
);

export default LoadingRows;
