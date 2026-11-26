const HeaderContainer = ({ title, name }) => {
    return (
        <header>
            <b>{title}</b>
            <div className="who">
                <div>Name:<br /><b>{name}</b></div>
                <div className="av">{(name || 'O')[0].toUpperCase()}</div>
            </div>
        </header>
    )
}
export default HeaderContainer;
