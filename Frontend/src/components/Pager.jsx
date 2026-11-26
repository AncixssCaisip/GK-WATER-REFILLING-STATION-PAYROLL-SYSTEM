const Pager = ({ total, page, size, onPage }) => {
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(page, pages);
    const from = total ? (current - 1) * size + 1 : 0;
    const to = Math.min(total, current * size);
    return (
        <div className="pg">
            <span>Showing <b>{from}-{to}</b> of {total}</span>
            <span>
                <button aria-label="Previous page" onClick={() => onPage(Math.max(1, current - 1))}>&lt;</button> <b>{current}</b>{' '}
                <button aria-label="Next page" onClick={() => onPage(Math.min(pages, current + 1))}>&gt;</button>
            </span>
        </div>
    )
}
export default Pager;
