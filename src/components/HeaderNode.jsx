export default function HeaderNode({ data, style }) {
    return (
        <div style={style}>
            {data.label}
        </div>
    );
};