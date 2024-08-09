class View {
  render(shouldRender = true, output) {
    if (shouldRender)
      console.log(output)
    
    return output
  }
}

export default View
