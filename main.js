"use strict";
// 188500

var MAIN_CHESS_GRID = new Chess()
var CURRENT_MOVE = null
var turnIndicator = null

document.addEventListener( "DOMContentLoaded" , ()=>{

	// render DOM Elements
	intializeChessGrid()

	let coordinates = document.querySelector(".co-ordinates")
	coordinates.style.height = Math.floor( 0.8 * Math.min(window.innerHeight , window.innerWidth))+"px"
	coordinates.style.width = coordinates.style.height
	// console.log(findBestMove(MAIN_CHESS_GRID))

	// buttons onclicks
	document.querySelector(".undo").addEventListener('click',()=>{
		if (MAIN_CHESS_GRID.turn() == 'w'){
			MAIN_CHESS_GRID.undo()
			MAIN_CHESS_GRID.undo()
			intializeChessGrid()
		}
	})
	document.querySelector(".reset").addEventListener('click',()=>{
		MAIN_CHESS_GRID = new Chess()
		intializeChessGrid()
	})

	turnIndicator = document.querySelector('.buttons h2')


})

const intializeChessGrid = () => {
	let divHeight = Math.floor(0.1 * Math.min(window.innerHeight , window.innerWidth))

	let board = MAIN_CHESS_GRID.board()

	let mainDiv = document.querySelector("main")
	document.querySelector(".buttons").style.width = `${divHeight*8}px`
	mainDiv.innerHTML = ""
	mainDiv.style.width = `${divHeight*8}px`
	mainDiv.style.height = `${divHeight*8}px`

	for(let i = 0 ; i < 64 ; i++){

		let divElement = document.createElement("div")
		
		divElement.style.height = `${divHeight}px`

		if ( (i + ( Math.floor(i/8)%2 ) ) % 2 == 1 )
			divElement.style.backgroundColor = "darkslategrey"

		divElement.id = `${String.fromCharCode(97+i%8)}${8-Math.floor(i/8)}`

		let piece = board[Math.floor(i/8)][i%8]
		
		divElement.setAttribute("onclick","showPossibleMoves(this)")
		if(piece != null){
			divElement.style.cursor = "pointer"
			divElement.innerHTML = `<img src="icons/${piece.type}${piece.color}.svg" >`
		}

		mainDiv.append(divElement)
	}
}




const showPossibleMoves = (ele) => {
	if( CURRENT_MOVE == null ){
		let possibleMoves =  MAIN_CHESS_GRID.moves({verbose:true})
							.filter( ({from}) => from == ele.id )
		possibleMoves.forEach(  m => {
			document.getElementById(m.to).classList.add("dot")
		})			

		CURRENT_MOVE  = possibleMoves		
	}
	else {
		let move = CURRENT_MOVE.filter( ({to})=> to == ele.id )
		if (move.length == 0){
			CURRENT_MOVE.forEach(  m => {
				document.getElementById(m.to).classList.remove("dot")
			}) 
			CURRENT_MOVE = null
			showPossibleMoves(ele)
		}else{

			MAIN_CHESS_GRID.move(move[0])
			intializeChessGrid()
			CURRENT_MOVE = null

			turnIndicator.innerText  = "Computers Turn - Black"
			if(!checkGameOver())
				setTimeout(playBot , 100)
		}
	}
}

const checkGameOver = () => {
	if (MAIN_CHESS_GRID.game_over()){

		if (MAIN_CHESS_GRID.in_stalemate())	
			swal("Draw", "Stalement");
		else if( MAIN_CHESS_GRID.in_threefold_repetition() )
			swal("Draw","Threefold Repetition")
		else if ( MAIN_CHESS_GRID.in_draw() )
			swal("Draw"," 50-move rule or insufficient material idk")
		else if (MAIN_CHESS_GRID.in_checkmate()){

			if (MAIN_CHESS_GRID.turn() == 'b' ){
				swal("Win","white won")
			}else {
				swal("Lose","Black wins")
			}

		}else{
			swal("GameOver","this alert should never appear")
		}

		return true
	}
	return false
}



const playBot = async () => {
	// console.log("thinking!!!!.........")
	if( MAIN_CHESS_GRID.turn() == 'b'){
		let bestMove = findBestMoveAlphaBeta(MAIN_CHESS_GRID)
		MAIN_CHESS_GRID.move(bestMove)
		intializeChessGrid()
		// console.log("played")
		turnIndicator.innerText  = "Your Turn - White"
	}
}

const score = (board) => {

	let piece_score = { 
		'p':1 ,'n':3, 'b':3 , 'r':5 ,'q':9 , 'k':0,
		'P':-1 ,'N':-3, 'B':-3 , 'R':-5 ,'Q':-9 ,'K':0
	}

	let total_score = 0

	board.forEach( row => {
		row.forEach( piece => {
			if(piece != null){
				if(piece.color == 'w')
					total_score += piece_score[piece.type.toUpperCase()]
				else
					total_score += piece_score[piece.type]
			}
		} )
	} )
	return total_score
}

const depthMoves = (chess , depth ) => {
	let totalMoves = 0
	for(let move1 of chess.moves()){
		let chessCopy1 = new Chess(chess.fen())
		chessCopy1.move(move1)
		for (let move2 of chessCopy1.moves() ){
			let chessCopy2 = new Chess(chessCopy1.fen())
			chessCopy2.move(move2)
			totalMoves+= chessCopy1.moves().length
		}
	}
	return totalMoves

}


const alphabeta = (chess , depth ,alpha ,beta)  => {
	if ( chess.in_checkmate() && chess.turn() == 'w' )
		return 100
	if ( chess.in_checkmate() && chess.turn() == 'b' )
		return -100
	if (depth > 1){
		return score(chess.board())
	}

	let allPossibleMoves = chess.moves()
	if (chess.turn() == 'b'){	
		let maxScore = -Infinity
		for(let move of allPossibleMoves){
			let chessCopy = new Chess(chess.fen())
			chessCopy.move(move)
			let currentScore = alphabeta(chessCopy , depth+1 , alpha , beta)
			maxScore = Math.max(maxScore , currentScore)
			alpha = Math.max(maxScore , alpha)
			if (alpha >= beta)
				break
		}
		return maxScore

	}else{
		let minScore = Infinity
		for(let move of allPossibleMoves){
			let chessCopy = new Chess(chess.fen())
			chessCopy.move(move)
			let currentScore = alphabeta(chessCopy , depth+1 , alpha , beta)
			minScore = Math.min(minScore , currentScore)
			beta = Math.min(minScore , beta)
			if (alpha >= beta)
				break
		}
		return minScore

	}



}


// computer plays black
const minmax = (chess , depth) => {
	if ( chess.in_checkmate() && chess.turn() == 'w' )
		return 100
	if ( chess.in_checkmate() && chess.turn() == 'b' )
		return -100
	if (depth > 1)
		return score(chess.board())

	let allPossibleMoves = chess.moves()

	let allPossibleScores = []

	allPossibleMoves.forEach( move => {
		let chessCopy = new Chess(chess.fen())
		chessCopy.move(move)
		allPossibleScores.push(minmax(chessCopy , depth + 1))
	})

	// black tries to maximize
	if ( chess.turn() == "b" ){		
		return Math.max(...allPossibleScores)
	}else{
		return Math.min(...allPossibleScores)
	}

}

// computer plays black
const findBestMoveAlphaBeta = (chess) => {
	let maxScore = -Infinity
	let maxScoreMove = null
	let currentScore = null
	for( let move of chess.moves() ){
		let chessCopy = new Chess(chess.fen())
		chessCopy.move(move)
		currentScore = alphabeta(chessCopy , 0 , -Infinity , Infinity )
		if (currentScore  > maxScore){
			maxScore = currentScore
			maxScoreMove = move
		}
	}
	return maxScoreMove

}
const findBestMove = (chess) => {

	let allPossibleMoves = chess.moves()
	let allPossibleMovesScore = []

	let maxScore = null
	let currentScore = null

	allPossibleMoves.forEach( move => {
		let chessCopy = new Chess(chess.fen())
		chessCopy.move(move)

		currentScore =  minmax(chessCopy  , 0 )
		allPossibleMovesScore.push(currentScore)

		if( maxScore == null || currentScore > maxScore){
			maxScore = currentScore
		}
			
	} )
	let maxScoreMoves = allPossibleMoves.filter( (m,i)=> allPossibleMovesScore[i] == maxScore )
	if (maxScoreMoves.length == 1) 
		return maxScoreMoves[0]
	else
		return maxScoreMoves[ Math.floor( Math.random()*maxScoreMoves.length ) ]
}

