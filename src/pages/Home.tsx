export default function Home() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1
        style={{
          color: "#EDEDED",
          fontSize: "2rem",
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        Final de la Guerra Civil Española e Inicio del Franquismo
      </h1>

      <p
        style={{
          color: "#999999",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        Proyecto de Historia - Grupo 2
      </p>

      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          aspectRatio: "16/9",
        }}
      >
        <iframe
          src="https://drive.google.com/file/d/1X2z6X4tNg8wNptGy6tTj3nuOiM7h78wE/preview"
          width="100%"
          height="100%"
          allow="autoplay; fullscreen"
          style={{
            border: "none",
            borderRadius: "12px",
          }}
          title="Documental Histórico"
        />
      </div>
    </div>
  );
}
