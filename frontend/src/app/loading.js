import './globals.css'
import colors from "@/styles/colors";

export default function Loading() {
    return (
        <div>
            <div className="chart-panel-loading">
                <div
                    style={{
                        textAlign: "center",
                        padding: "0.5%",
                        backgroundColor: colors.secondary,
                        color: "white",
                        fontSize: "22px",
                    }}
                >
                    <b>Consumer Price Index | </b> <small>Monthly base 2017</small>
                </div>
                <div className="glimmer-panel">
                    <div className="glimmer-line" />
                    <div className="glimmer-line" />
                    <div className="glimmer-line" />
                    <div className="glimmer-line" />
                    <div className="glimmer-line" />
                    <div className="glimmer-line" />
                </div>
            </div>
        </div>
    );
}