import introSoccerBalls from "./img/dalle_bestgoat.png";
import { IconSoccer, IconTv, IconVote } from "./img/Icons";

function Intro({ }) {
    return (
        <div className="intro-container">
            <div className="intro-boxes">
                <div className="intro-box">
                    <IconSoccer />
                </div>
                <div className="intro-box">
                    <IconVote />
                </div>
                <div className="intro-box">
                    <IconTv />
                </div>
            </div>
            <div className="intro-balls-image">
                <img src={introSoccerBalls} alt="introSoccerBalls"></img>
            </div>


        </div>
    )
}

export default Intro;