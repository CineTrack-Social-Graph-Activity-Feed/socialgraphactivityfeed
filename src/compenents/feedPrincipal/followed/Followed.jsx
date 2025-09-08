import "./Followed.css";

function Followed() {
  return (
    <div className="followed-container">
      <h2 className="followed-title">Usuarios a los que sigues</h2>
      <div className="followed-users">
        <div className="followed-user-item">
          <a href="" className="followed-user">
            <img
              src="https://i.pravatar.cc/60?img=15"
              alt="avatar user"
              className="avatar-post"
            />
            <div>
              <p className="followed-user-name">Paul Rudd</p>
              <p className="followed-user-followers">6M+ Seguidores</p>
            </div>
          </a>
        </div>
        <div className="followed-user-item">
          <a href="" className="followed-user">
            <img
              src="https://i.pravatar.cc/60?img=10"
              alt="avatar user"
              className="avatar-post"
            />
            <div>
              <p className="followed-user-name">Jane Foster</p>
              <p className="followed-user-followers">2M+ Seguidores</p>
            </div>
          </a>
        </div>
        <div className="followed-user-item">
          <a href="" className="followed-user">
            <img
              src="https://i.pravatar.cc/60?img=32"
              alt="avatar user"
              className="avatar-post"
            />
            <div>
              <p className="followed-user-name">Anna Parker</p>
              <p className="followed-user-followers">1M+ Seguidores</p>
            </div>
          </a>
        </div>
        {/* Aquí se mapean los usuarios seguidos */}
      </div>
    </div>
  );
}
export default Followed;
