import {Suspense, useState} from "react";

function usePromise(asyncFn) {
  const promiseRef = useRef();
  const resultRef = useRef();
  const errorRef = useRef();
  const statusRef = useRef("pending");

  if (statusRef.current === "pending") {
    promiseRef.current = asyncFn()
      .then(result => {
        resultRef.current = result;
        statusRef.current = "success";
      })
      .catch(err => {
        errorRef.current = err;
        statusRef.current = "error";
      });
    throw promiseRef.current;
  }
  if (statusRef.current === "error") {
    throw errorRef.current;
  }
  return resultRef.current;
}

function Page1() {
	return (
		<div>this is page 1</div>
	);
}

function Page2() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<div>this is page 2</div>
		</Suspense>
	);
}

export default function() {
	let [currentPage, setCurrentPage]=useState("page1");

	return (<>
		<button onClick={()=>setCurrentPage("page1")}>page 1</button>
		<button onClick={()=>setCurrentPage("page2")}>page 2</button>

		<div>
			{currentPage=="page1" && <Page1/>}
			{currentPage=="page2" && <Page2/>}
		</div>
	</>);
}
