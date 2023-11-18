import introSoccerBalls from "./img/dalle_bestgoat.png";

function Intro({ }) {
    return (
        <div className="intro-container">
            <div className="intro-boxes">
                <div className="intro-box">

                </div>
                <div className="intro-box">

                </div>
                <div className="intro-box">

                </div>
            </div>
            <div className="intro-balls-image">
                <img src={introSoccerBalls} alt="introSoccerBalls"></img>
            </div>


        </div>
    )
}

export default Intro;