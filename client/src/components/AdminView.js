import React from "react"

export const AdminView=()=>{
    const query = () => {
        // fetch('/audio', {
        //     headers:{
        //         'Content-Type': 'audio/mpeg'
        //     }
        // })
        let audio = new Audio('/stream'); // the above
        audio.play();
    }
    return(
        <div>
            <h1>AdminView</h1>
            <button

                onClick={query}
            >
                Click me
            </button>
        </div>
    )
}
